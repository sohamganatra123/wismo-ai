import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, type MutationCtx } from "./_generated/server";
import { collectInvestigationEvidence } from "./domain/investigation";
import { scheduleCaseAgentRun } from "./lib/agentScheduling";
import { recordCaseEvent } from "./lib/caseEvents";

export async function collectForCaseInMutation(
  ctx: MutationCtx,
  args: { caseId: Id<"cases">; actorUserId?: Id<"users"> },
) {
  const item = await ctx.db.get(args.caseId);
  if (!item) throw new Error("Case not found");
  if (!item.customerId) throw new Error("Match a Shopify customer before investigating");
  if (!item.orderId) throw new Error("Select one Shopify order before investigating");

  const order = await ctx.db.get(item.orderId);
  if (!order || order.customerId !== item.customerId) {
    throw new Error("The selected order does not belong to this customer");
  }

  const customerCases = await ctx.db
    .query("cases")
    .withIndex("by_customer_order", (q) => q.eq("customerId", item.customerId))
    .collect();
  const safeCaseIds = new Set(customerCases.map((entry) => entry._id));
  const customerMessages = (
    await Promise.all(
      customerCases.map((entry) =>
        ctx.db.query("messages").withIndex("by_case", (q) => q.eq("caseId", entry._id)).collect(),
      ),
    )
  )
    .flat()
    .filter(
      (message) =>
        message.party === "customer" &&
        message._id !== item.sourceMessageId &&
        message.caseId !== undefined &&
        safeCaseIds.has(message.caseId),
    );
  const scans = await ctx.db
    .query("trackingScans")
    .withIndex("by_order", (q) => q.eq("orderId", order._id))
    .collect();
  const approvedMemories = (
    await ctx.db
      .query("memories")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect()
  ).filter(
    (memory) =>
      memory.scope === "case_guidance" && memory.caseId === args.caseId,
  );
  const appliedGuidance = approvedMemories.map((memory) => memory.guidance.trim()).filter(Boolean);

  const evidence = collectInvestigationEvidence({
    order: {
      id: order._id,
      name: order.name,
      createdAt: order.createdAt,
      lineItems: order.lineItems,
      fulfillmentStatus: order.fulfillmentStatus,
      ...(order.trackingNumber ? { trackingNumber: order.trackingNumber } : {}),
      ...(order.trackingUrl ? { trackingUrl: order.trackingUrl } : {}),
    },
    previousMessages: customerMessages.map((message) => ({
      id: message._id,
      subject: message.subject,
      text: message.text,
      sentAt: message.sentAt,
    })),
    scans: scans.map((scan) => ({
      trackingNumber: scan.trackingNumber,
      status: scan.status,
      eventTime: scan.eventTime,
      ...(scan.location ? { location: scan.location } : {}),
      ...(scan.description ? { description: scan.description } : {}),
    })),
  });
  const hasConflict = scans.some(
    (scan) =>
      order.trackingNumber !== undefined &&
      scan.trackingNumber !== order.trackingNumber,
  );
  const collectedAt = Date.now();
  const previousSnapshots = await ctx.db
    .query("investigations")
    .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
    .collect();
  for (const snapshot of previousSnapshots) await ctx.db.delete(snapshot._id);
  await ctx.db.insert("investigations", {
    caseId: args.caseId,
    orderId: order._id,
    previousMessages: evidence.previousMessages.map((message) => ({
      messageId: message.id as typeof item.sourceMessageId,
      subject: message.subject,
      text: message.text,
      sentAt: message.sentAt,
    })),
    fulfillmentStatus: evidence.order.fulfillmentStatus,
    ...(evidence.latestTracking ? { latestTracking: evidence.latestTracking } : {}),
    hasConflict,
    collectedAt,
  });
  await ctx.db.patch(args.caseId, {
    status: "investigating",
    ...(appliedGuidance.length
      ? {
          guidance: appliedGuidance.join("\n\n"),
          recommendation: "Apply founder-approved guidance before sending the next update.",
        }
      : {}),
    updatedAt: collectedAt,
  });
  await recordCaseEvent(ctx, {
    caseId: args.caseId,
    type: "investigation_completed",
    summary: `Collected ${evidence.previousMessages.length} previous customer email${evidence.previousMessages.length === 1 ? "" : "s"}, Shopify order ${order.name}, fulfillment, and ${evidence.latestTracking ? "the latest matching tracking update" : "no valid matching tracking update"}.`,
    contextSource: "gmail,shopify,tracking",
    toolName: "collectInvestigationEvidence",
    toolResult: {
      previousMessageCount: evidence.previousMessages.length,
      orderId: order.shopifyOrderId,
      fulfillmentStatus: order.fulfillmentStatus,
      latestTracking: evidence.latestTracking ?? null,
      appliedMemoryIds: approvedMemories.map((memory) => memory._id),
    },
    actorUserId: args.actorUserId,
  });

  return { ...evidence, hasConflict, collectedAt };
}

export const collectForCase = internalMutation({
  args: { caseId: v.id("cases"), actorUserId: v.optional(v.id("users")) },
  handler: collectForCaseInMutation,
});

// Temporary authenticated retry entry point. It gathers evidence only; the
// agent dispatcher is the single place that may create an action proposal.
export const run = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const actorUserId = await getAuthUserId(ctx);
    if (!actorUserId) throw new Error("Sign in required");
    const evidence = await collectForCaseInMutation(ctx, { ...args, actorUserId });
    await scheduleCaseAgentRun(ctx, { caseId: args.caseId, trigger: "retry" });
    return evidence;
  },
});
