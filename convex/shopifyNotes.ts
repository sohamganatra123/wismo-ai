import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { claimableShopifyNote } from "./domain/shopifyNote";
import { recordCaseEvent } from "./lib/caseEvents";
import { escalateCase } from "./lib/escalations";
import { decryptCredentials } from "./security/credentials";

type ShopifyCredentials = { accessToken: string };
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export const getExecutionInput = internalQuery({
  args: { approvalId: v.id("approvals") },
  handler: async (ctx, args) => ({
    approval: await ctx.db.get(args.approvalId),
    connection: await ctx.db.query("integrations").withIndex("by_kind", (q) => q.eq("kind", "shopify")).unique(),
  }),
});

export const claim = internalMutation({
  args: { approvalId: v.id("approvals"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", args.userId)).unique();
    if (!profile) throw new Error("Manager access required");
    const approval = await ctx.db.get(args.approvalId);
    const payload = claimableShopifyNote(approval);
    await ctx.db.patch(args.approvalId, { status: "executing", decidedAt: Date.now(), decidedBy: args.userId });
    return payload;
  },
});

export const finish = internalMutation({
  args: { approvalId: v.id("approvals") },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.approvalId);
    if (!approval || approval.status !== "executing") return;
    const now = Date.now();
    await ctx.db.patch(args.approvalId, { status: "completed", executedAt: now });
    await recordCaseEvent(ctx, { caseId: approval.caseId, type: "shopify_courier_note_added", summary: "Added the approved courier update to the Shopify order note.", contextSource: "shopify", toolName: "orderUpdate", actorUserId: approval.decidedBy });
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
      escalationReason: "Approved Shopify order note failed",
      recommendation: "Review Shopify access and apply the courier update note manually if needed.",
      contextSource: "shopify",
      error: args.error,
      actorUserId: approval.decidedBy,
    });
  },
});

export const approveAndApply = action({
  args: { approvalId: v.id("approvals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to approve this Shopify update");
    const input = await ctx.runQuery(internal.shopifyNotes.getExecutionInput, args);
    if (!input.connection) throw new Error("Shopify is not connected");
    const payload = await ctx.runMutation(internal.shopifyNotes.claim, { ...args, userId });
    try {
      const credentials = await decryptCredentials<ShopifyCredentials>(input.connection.encryptedCredentials, required("INTEGRATION_ENCRYPTION_KEY"));
      const endpoint = `https://${input.connection.accountLabel}/admin/api/${required("SHOPIFY_API_VERSION")}/graphql.json`;
      const headers = { "Content-Type": "application/json", "X-Shopify-Access-Token": credentials.accessToken };
      const currentResponse = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ query: "query WismoOrderNote($id: ID!) { order(id: $id) { note } }", variables: { id: payload.orderId } }) });
      const currentBody = await currentResponse.json() as { data?: { order?: { note?: string | null } }; errors?: unknown };
      if (!currentResponse.ok || currentBody.errors || !currentBody.data?.order) throw new Error("Could not read the Shopify order note");
      const note = [currentBody.data.order.note?.trim(), payload.note].filter(Boolean).join("\n\n");
      const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ query: "mutation WismoOrderNote($input: OrderInput!) { orderUpdate(input: $input) { order { id } userErrors { message } } }", variables: { input: { id: payload.orderId, note } } }) });
      const body = await response.json() as { data?: { orderUpdate?: { order?: { id: string }; userErrors?: Array<{ message: string }> } }; errors?: unknown };
      const userError = body.data?.orderUpdate?.userErrors?.[0]?.message;
      if (!response.ok || body.errors || userError || !body.data?.orderUpdate?.order) throw new Error(userError ?? "Shopify order note failed");
      await ctx.runMutation(internal.shopifyNotes.finish, args);
      return { status: "applied" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Shopify order note failed";
      await ctx.runMutation(internal.shopifyNotes.fail, { ...args, error: message });
      throw error;
    }
  },
});
