import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";
import {
  claimableIdentityRequest,
  identityRequestHeaders,
  type IdentityRequestPayload,
} from "./domain/identityRequest";
import { isOrderSelectionRequestPayload } from "./domain/orderSelectionRequest";
import { recordCaseEvent } from "./lib/caseEvents";
import { escalateCase } from "./lib/escalations";
import { decryptCredentials } from "./security/credentials";

type Tokens = { refresh_token?: string };
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export const getExecutionInput = internalQuery({
  args: { approvalId: v.id("approvals") },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.approvalId);
    const connection = await ctx.db
      .query("integrations")
      .withIndex("by_kind", (q) => q.eq("kind", "gmail"))
      .unique();
    return { approval, connection };
  },
});

export const claim = internalMutation({
  args: { approvalId: v.id("approvals"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile) throw new Error("Manager access required");
    const approval = await ctx.db.get(args.approvalId);
    const payload = approval?.payload && isOrderSelectionRequestPayload(approval.payload)
      ? (() => {
          if (approval.kind !== "customer_email" || approval.status !== "pending") {
            throw new Error("This order-selection request was already handled");
          }
          return approval.payload;
        })()
      : claimableIdentityRequest(approval);
    await ctx.db.patch(args.approvalId, {
      status: "executing",
      decidedAt: Date.now(),
      decidedBy: args.userId,
    });
    return payload;
  },
});

export const finish = internalMutation({
  args: {
    approvalId: v.id("approvals"),
    providerId: v.string(),
    from: v.string(),
    payload: v.object({
      actionKey: v.string(),
      threadId: v.string(),
      to: v.string(),
      subject: v.string(),
      text: v.string(),
      messageIdHeader: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.approvalId);
    if (!approval || approval.status !== "executing") return;
    const now = Date.now();
    await ctx.db.insert("messages", {
      providerId: args.providerId,
      threadId: args.payload.threadId,
      direction: "outbound",
      party: "support",
      from: args.from,
      to: [args.payload.to],
      subject: args.payload.subject,
      text: args.payload.text,
      hasAttachments: false,
      sentAt: now,
      deliveryStatus: "sent",
      caseId: approval.caseId,
    });
    await ctx.db.patch(args.approvalId, { status: "completed", executedAt: now });
    await ctx.db.patch(approval.caseId, { firstActionAt: now, updatedAt: now });
    await recordCaseEvent(ctx, {
      caseId: approval.caseId,
      type: "identity_request_sent",
      summary: args.payload.actionKey.startsWith("order-selection:")
        ? "Sent the approved safe order-selection request."
        : "Sent the approved checkout email and order number request.",
      contextSource: "gmail",
      toolName: "gmail.messages.send",
      toolResult: { providerId: args.providerId },
    });
  },
});

export const fail = internalMutation({
  args: { approvalId: v.id("approvals"), error: v.string() },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.approvalId);
    if (!approval || approval.status !== "executing") return;
    await ctx.db.patch(args.approvalId, { status: "failed", error: args.error });
    await escalateCase(ctx, {
      caseId: approval.caseId,
      escalationReason: "Approved identity request failed to send",
      recommendation: "Review Gmail access, then resend the checkout email and order number request safely.",
      contextSource: "gmail",
      error: args.error,
      actorUserId: approval.decidedBy,
    });
  },
});

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: required("GOOGLE_CLIENT_ID"),
      client_secret: required("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = (await response.json()) as { access_token?: string };
  if (!response.ok || !body.access_token) throw new Error("Could not refresh Gmail access");
  return body.access_token;
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const approveAndSend = action({
  args: { approvalId: v.id("approvals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to approve this request");
    const input = await ctx.runQuery(internal.identityRequests.getExecutionInput, args);
    if (!input.connection) throw new Error("Gmail is not connected");
    const payload = await ctx.runMutation(internal.identityRequests.claim, {
      ...args,
      userId,
    });
    try {
      const credentials = await decryptCredentials<Tokens>(
        input.connection.encryptedCredentials,
        required("INTEGRATION_ENCRYPTION_KEY"),
      );
      if (!credentials.refresh_token) throw new Error("Reconnect Gmail");
      const token = await refreshAccessToken(credentials.refresh_token);
      const raw = base64Url(
        `${identityRequestHeaders(payload as IdentityRequestPayload).join("\r\n")}\r\n\r\n${payload.text}`,
      );
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: payload.threadId, raw }),
      });
      const result = (await response.json()) as { id?: string };
      if (!response.ok || !result.id) throw new Error("Gmail identity request failed");
      await ctx.runMutation(internal.identityRequests.finish, {
        ...args,
        providerId: result.id,
        from: input.connection.accountLabel,
        payload,
      });
      return { status: "sent" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gmail identity request failed";
      await ctx.runMutation(internal.identityRequests.fail, { ...args, error: message });
      throw error;
    }
  },
});
