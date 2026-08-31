import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { customerUpdateDraft } from "./domain/customerUpdate";
import { collectInvestigationEvidence } from "./domain/investigation";

function senderEmail(from: string) {
  return from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
}

export const run = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");

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
    const collectedAt = Date.now();
    const sourceMessage = await ctx.db.get(item.sourceMessageId);
    let preparedApprovalId = null;
    if (evidence.latestTracking && order.trackingNumber && sourceMessage) {
      const recipient = senderEmail(sourceMessage.from);
      if (!recipient) throw new Error("The customer has no safe reply address");
      const draft = customerUpdateDraft({
        caseId: args.caseId,
        threadId: sourceMessage.threadId,
        messageIdHeader: sourceMessage.messageIdHeader,
        recipient,
        subject: sourceMessage.subject,
        orderName: order.name,
        fulfillmentStatus: order.fulfillmentStatus,
        orderTrackingNumber: order.trackingNumber,
        latestTracking: evidence.latestTracking,
      });
      const existingApproval = await ctx.db
        .query("approvals")
        .withIndex("by_action_key", (q) => q.eq("actionKey", draft.actionKey))
        .unique();
      preparedApprovalId = existingApproval?._id ?? await ctx.db.insert("approvals", {
        caseId: args.caseId,
        actionKey: draft.actionKey,
        kind: "customer_email",
        revision: 1,
        payload: draft,
        status: "pending",
        proposedAt: collectedAt,
      });
    }

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
      collectedAt,
    });
    await ctx.db.patch(args.caseId, {
      status: preparedApprovalId ? "awaiting_approval" : "investigating",
      ...(item.firstActionAt
        ? {}
        : preparedApprovalId
          ? { firstActionAt: collectedAt }
          : {}),
      updatedAt: collectedAt,
    });
    await ctx.db.insert("events", {
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
        preparedApprovalId,
        preparedWithinTwoMinutes: preparedApprovalId !== null,
      },
      actorUserId: userId,
      createdAt: collectedAt,
    });

    return { ...evidence, collectedAt, preparedApprovalId };
  },
});
