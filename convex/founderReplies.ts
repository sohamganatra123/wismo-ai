import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";
import {
  founderReplyDraft,
  founderReplyHeaders,
  type FounderReplyPayload,
} from "./domain/founderReply";
import { recordCaseEvent } from "./lib/caseEvents";
import { decryptCredentials } from "./security/credentials";
import { manualReplyCapability } from "./domain/manualReplyAccess";

type Tokens = { refresh_token?: string };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function replyAddress(from: string) {
  const bracketed = from.match(/<([^<>\s]+@[^<>\s]+)>/);
  const plain = from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const address = bracketed?.[1] ?? plain?.[0];
  if (!address) throw new Error("The customer has no replyable email address");
  return address;
}

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
  const body = (await response.json()) as {
    access_token?: string;
    error_description?: string;
  };
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description ?? "Could not refresh Gmail access");
  }
  return body.access_token;
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const claim = internalMutation({
  args: {
    caseId: v.id("cases"),
    userId: v.id("users"),
    requestId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (profile?.role !== "founder") throw new Error("Founder access required");

    const item = await ctx.db.get(args.caseId);
    if (!item) throw new Error("Case not found");
    const source = await ctx.db.get(item.sourceMessageId);
    if (!source) throw new Error("Source message not found");
    const thread = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", source.threadId))
      .collect();
    const latestCustomerMessage = thread
      .filter((message) => message.direction === "inbound" && message.party === "customer")
      .sort((left, right) => right.sentAt - left.sentAt)[0] ?? source;
    const hasFounderReply = thread.some(
      (message) =>
        message.direction === "outbound" && message.kind === "founder_reply" &&
        message.deliveryStatus === "sent",
    );
    const capability = manualReplyCapability({
      role: profile.role,
      caseStatus: item.status,
      hasFounderReply,
    });
    if (!capability.allowed) {
      if (capability.reason === "reply_already_sent") return { status: "already_sent" as const };
      throw new Error(
        capability.reason === "case_closed"
          ? "This conversation is already resolved"
          : "Founder access required",
      );
    }
    const payload = founderReplyDraft({
      caseId: item._id,
      threadId: source.threadId,
      messageIdHeader: latestCustomerMessage.messageIdHeader,
      recipient: replyAddress(latestCustomerMessage.from),
      subject: latestCustomerMessage.subject || source.subject,
      text: args.text,
      requestId: args.requestId,
    });
    const existing = await ctx.db
      .query("approvals")
      .withIndex("by_action_key", (q) => q.eq("actionKey", payload.actionKey))
      .unique();
    if (existing?.status === "completed") {
      return { status: "already_sent" as const };
    }
    if (existing) throw new Error("This reply request is already being handled");

    const now = Date.now();
    const approvalId = await ctx.db.insert("approvals", {
      caseId: item._id,
      actionKey: payload.actionKey,
      kind: "customer_email",
      revision: 1,
      payload,
      status: "executing",
      decisionSource: "manager",
      proposedAt: now,
      decidedAt: now,
      decidedBy: args.userId,
    });
    return {
      status: "claimed" as const,
      approvalId,
      payload,
      customerText: latestCustomerMessage.text,
      sourceMessageId: latestCustomerMessage._id,
    };
  },
});

export const finish = internalMutation({
  args: {
    approvalId: v.id("approvals"),
    providerId: v.string(),
    from: v.string(),
    customerText: v.string(),
    sourceMessageId: v.id("messages"),
    payload: v.object({
      actionKey: v.string(),
      threadId: v.string(),
      messageIdHeader: v.optional(v.string()),
      to: v.string(),
      subject: v.string(),
      text: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.approvalId);
    if (!approval || approval.status !== "executing" || !approval.decidedBy) return;
    const duplicate = await ctx.db
      .query("messages")
      .withIndex("by_provider_id", (q) => q.eq("providerId", args.providerId))
      .unique();
    if (duplicate) return;

    const now = Date.now();
    const replyMessageId = await ctx.db.insert("messages", {
      providerId: args.providerId,
      threadId: args.payload.threadId,
      direction: "outbound",
      party: "support",
      kind: "founder_reply",
      actorUserId: approval.decidedBy,
      from: args.from,
      to: [args.payload.to],
      subject: args.payload.subject,
      text: args.payload.text,
      hasAttachments: false,
      sentAt: now,
      deliveryStatus: "sent",
      caseId: approval.caseId,
    });
    const replyExampleId = await ctx.db.insert("replyExamples", {
      caseId: approval.caseId,
      sourceMessageId: args.sourceMessageId,
      replyMessageId,
      customerText: args.customerText,
      replyText: args.payload.text,
      createdBy: approval.decidedBy,
      createdAt: now,
    });
    await ctx.db.patch(args.approvalId, { status: "completed", executedAt: now });
    const item = await ctx.db.get(approval.caseId);
    await ctx.db.patch(approval.caseId, {
      status: "closed",
      ...(item?.firstActionAt ? {} : { firstActionAt: now }),
      resolvedAt: now,
      closedAt: now,
      updatedAt: now,
    });
    await recordCaseEvent(ctx, {
      caseId: approval.caseId,
      type: "founder_reply_sent",
      summary: "Founder replied in the Gmail thread and resolved the case.",
      contextSource: "gmail,founder_review",
      toolName: "gmail.messages.send",
      toolResult: { providerId: args.providerId, replyExampleId },
      actorUserId: approval.decidedBy,
    });
  },
});

export const fail = internalMutation({
  args: { approvalId: v.id("approvals"), error: v.string() },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.approvalId);
    if (!approval || approval.status !== "executing") return;
    await ctx.db.patch(args.approvalId, { status: "failed", error: args.error });
    await recordCaseEvent(ctx, {
      caseId: approval.caseId,
      type: "founder_reply_failed",
      summary: "Founder reply could not be sent.",
      contextSource: "gmail,founder_review",
      error: args.error,
      actorUserId: approval.decidedBy,
    });
  },
});

export const sendFounderReply = action({
  args: { caseId: v.id("cases"), requestId: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to send a reply");
    const connection = await ctx.runQuery(internal.gmailData.getConnection, {});
    if (!connection) throw new Error("Gmail is not connected");
    const claim = await ctx.runMutation(internal.founderReplies.claim, { ...args, userId });
    if (claim.status === "already_sent") return { status: "already_sent" as const };

    try {
      const credentials = await decryptCredentials<Tokens>(
        connection.encryptedCredentials,
        required("INTEGRATION_ENCRYPTION_KEY"),
      );
      if (!credentials.refresh_token) throw new Error("Reconnect Gmail");
      const token = await refreshAccessToken(credentials.refresh_token);
      const payload = claim.payload as FounderReplyPayload;
      const raw = base64Url(
        `${founderReplyHeaders(payload).join("\r\n")}\r\n\r\n${payload.text}`,
      );
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: payload.threadId, raw }),
      });
      const result = (await response.json()) as { id?: string };
      if (!response.ok || !result.id) throw new Error("Gmail founder reply failed");
      await ctx.runMutation(internal.founderReplies.finish, {
        approvalId: claim.approvalId,
        providerId: result.id,
        from: connection.accountLabel,
        customerText: claim.customerText,
        sourceMessageId: claim.sourceMessageId,
        payload,
      });
      return { status: "sent" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gmail founder reply failed";
      await ctx.runMutation(internal.founderReplies.fail, {
        approvalId: claim.approvalId,
        error: message,
      });
      throw error;
    }
  },
});
