import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { matchCourierReply } from "./domain/courierReply";
import { customerUpdateDraft } from "./domain/customerUpdate";
import { shopifyNotePayload } from "./domain/shopifyNote";
import { recordCaseEvent } from "./lib/caseEvents";
import { escalateCase } from "./lib/escalations";

function senderEmail(from: string) {
  return from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
}

async function requireManager(ctx: Parameters<typeof getAuthUserId>[0]) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in required");
  return userId;
}

export const prepareWaitingCase = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await requireManager(ctx);
    const item = await ctx.db.get(args.caseId);
    if (!item?.orderId) throw new Error("Select an order before contacting a courier");
    const contact = (await ctx.db.query("contacts").collect()).find((entry) => entry.active && entry.type === "courier");
    if (!contact) throw new Error("A founder must configure an active courier contact");
    const existing = await ctx.db.query("contactAttempts").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).first();
    if (existing) return { status: "waiting" as const, threadId: `courier:${args.caseId}`, contactName: contact.name };
    const now = Date.now();
    const threadId = `courier:${args.caseId}`;
    const messageId = await ctx.db.insert("messages", {
      providerId: `courier-request:${args.caseId}`,
      threadId,
      direction: "outbound",
      party: "courier",
      from: "WISMO",
      to: [contact.email],
      subject: `Delivery evidence request ${args.caseId}`,
      text: "Please provide the latest tracking status, event time, and location for the selected order tracking number.",
      hasAttachments: false,
      sentAt: now,
      deliveryStatus: "simulated",
      caseId: args.caseId,
    });
    await ctx.db.insert("contactAttempts", { caseId: args.caseId, contactId: contact._id, attemptNumber: 1, messageId, scheduledAt: now, sentAt: now });
    await ctx.db.patch(args.caseId, { status: "awaiting_courier", updatedAt: now });
    await recordCaseEvent(ctx, { caseId: args.caseId, type: "courier_contacted", summary: `Opened a controlled courier conversation with ${contact.name}.`, contextSource: "gmail", toolResult: { threadId, simulated: true } });
    return { status: "waiting" as const, threadId, contactName: contact.name };
  },
});

export const scheduleRetry = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await requireManager(ctx);
    const attempts = await ctx.db
      .query("contactAttempts")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    if (attempts.length === 0) throw new Error("Contact the courier before scheduling a retry");
    const lastAttempt = attempts.sort((left, right) => left.attemptNumber - right.attemptNumber).at(-1);
    if (!lastAttempt) throw new Error("Missing courier attempt");
    if (lastAttempt.replyMessageId) {
      return { status: "answered" as const };
    }
    if (lastAttempt.attemptNumber >= 3) {
      await escalateCase(ctx, {
        caseId: args.caseId,
        escalationReason: "Courier did not reply after three attempts",
        recommendation: "Assign a support agent and contact the courier manually.",
        contextSource: "gmail",
        toolResult: { attemptCount: attempts.length },
      });
      return { status: "escalated" as const };
    }
    const scheduledAt = Date.now() + 3 * 60 * 60 * 1000;
    await ctx.db.insert("contactAttempts", {
      caseId: args.caseId,
      contactId: lastAttempt.contactId,
      attemptNumber: lastAttempt.attemptNumber + 1,
      scheduledAt,
    });
    await recordCaseEvent(ctx, {
      caseId: args.caseId,
      type: "courier_retry_scheduled",
      summary: `Scheduled courier follow-up attempt ${lastAttempt.attemptNumber + 1}.`,
      contextSource: "gmail",
      toolResult: { scheduledAt },
    });
    return { status: "scheduled" as const, attemptNumber: lastAttempt.attemptNumber + 1, scheduledAt };
  },
});

export const receiveSimulated = mutation({
  args: { caseId: v.id("cases"), status: v.string(), eventTime: v.string(), location: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireManager(ctx);
    const item = await ctx.db.get(args.caseId);
    if (!item?.customerId || !item.orderId) throw new Error("Case identity and order are required");
    const order = await ctx.db.get(item.orderId);
    if (!order?.trackingNumber) throw new Error("Selected order has no tracking number");
    const attempt = await ctx.db.query("contactAttempts").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).first();
    if (!attempt) throw new Error("Contact the courier before receiving a reply");
    const contact = await ctx.db.get(attempt.contactId);
    if (!contact?.active) throw new Error("Configured courier contact is unavailable");
    const threadId = `courier:${args.caseId}`;
    const matched = matchCourierReply({
      configuredEmail: contact.email,
      senderEmail: contact.email,
      waitingThreadId: threadId,
      replyThreadId: threadId,
      orderTrackingNumber: order.trackingNumber,
      reply: { trackingNumber: order.trackingNumber, status: args.status, eventTime: args.eventTime, ...(args.location ? { location: args.location } : {}) },
    });
    if (!matched.ok) throw new Error(matched.reason);
    const source = await ctx.db.get(item.sourceMessageId);
    const recipient = source ? senderEmail(source.from) : undefined;
    if (!source || !recipient) throw new Error("Customer reply address is unavailable");
    const now = Date.now();
    const replyMessageId = await ctx.db.insert("messages", {
      providerId: `courier-reply:${args.caseId}:${args.eventTime}`,
      threadId,
      direction: "inbound",
      party: "courier",
      from: contact.email,
      to: ["WISMO"],
      subject: `Re: Delivery evidence request ${args.caseId}`,
      text: `${args.status} · ${args.eventTime}${args.location ? ` · ${args.location}` : ""}`,
      hasAttachments: false,
      sentAt: now,
      caseId: args.caseId,
    });
    await ctx.db.patch(attempt._id, { replyMessageId });
    await ctx.db.insert("trackingScans", { orderId: order._id, ...matched.scan, source: `courier:${contact.name}`, recordedAt: now });
    const customerDraft = customerUpdateDraft({
      caseId: args.caseId,
      threadId: source.threadId,
      messageIdHeader: source.messageIdHeader,
      recipient,
      subject: source.subject,
      orderName: order.name,
      fulfillmentStatus: order.fulfillmentStatus,
      orderTrackingNumber: order.trackingNumber,
      latestTracking: matched.scan,
    });
    const noteDraft = shopifyNotePayload({ caseId: args.caseId, orderId: order.shopifyOrderId, trackingNumber: order.trackingNumber, status: args.status, eventTime: args.eventTime });
    for (const proposal of [
      { actionKey: customerDraft.actionKey, kind: "customer_email" as const, payload: customerDraft },
      { actionKey: noteDraft.actionKey, kind: "shopify_note" as const, payload: noteDraft },
    ]) {
      const existing = await ctx.db.query("approvals").withIndex("by_action_key", (q) => q.eq("actionKey", proposal.actionKey)).unique();
      if (!existing) await ctx.db.insert("approvals", { caseId: args.caseId, ...proposal, revision: 1, status: "pending", proposedAt: now });
    }
    await ctx.db.patch(args.caseId, { status: "awaiting_approval", updatedAt: now });
    await recordCaseEvent(ctx, { caseId: args.caseId, type: "courier_reply_matched", summary: `Matched ${contact.name}'s reply and proposed Shopify and customer updates.`, contextSource: "gmail,tracking", toolResult: { trackingNumber: matched.scan.trackingNumber, status: matched.scan.status, eventTime: matched.scan.eventTime } });
    return { status: "proposed" as const, scan: matched.scan };
  },
});
