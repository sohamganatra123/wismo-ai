import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { recordCaseEvent } from "./lib/caseEvents";

export const getConnection = internalQuery({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("integrations")
      .withIndex("by_kind", (q) => q.eq("kind", "gmail"))
      .unique(),
});
export const isFounder = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) =>
    (
      await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique()
    )?.role === "founder",
});

export const advanceCursor = internalMutation({
  args: { integrationId: v.id("integrations"), cursor: v.string() },
  handler: async (ctx, args) =>
    ctx.db.patch(args.integrationId, {
      cursor: args.cursor,
      updatedAt: Date.now(),
    }),
});

const classification = v.union(
  v.literal("wismo"),
  v.literal("clarification"),
  v.literal("unrelated"),
);

function senderEmail(from: string) {
  return from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
}

function orderReference(subject: string, text: string) {
  return `${subject}\n${text}`.match(/(?:order\s*(?:number|no\.?|id)?\s*[:#]?|#)\s*([a-z0-9-]{3,})/i)?.[1]?.toUpperCase();
}

function statusReply(order: {
  orderId: string; customerName: string; status: string; trackingNumber?: string;
  carrier?: string; statusUpdatedAt: string;
}) {
  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";
  const carrier = order.carrier ? ` with ${order.carrier}` : "";
  const tracking = order.trackingNumber ? `\nTracking number: ${order.trackingNumber}` : "";
  return `Hi ${firstName},\n\nOrder #${order.orderId} is ${order.status.toLowerCase()}${carrier}.${tracking}\n\nThis status was updated ${new Date(order.statusUpdatedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC.\n\nWISMO`;
}

export const prepareInbound = internalMutation({
  args: {
    providerId: v.string(),
    threadId: v.string(),
    messageIdHeader: v.string(),
    from: v.string(),
    to: v.array(v.string()),
    subject: v.string(),
    text: v.string(),
    hasAttachments: v.boolean(),
    sentAt: v.number(),
    classification,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("messages")
      .withIndex("by_provider_id", (q) => q.eq("providerId", args.providerId))
      .unique();
    if (existing) {
      if (!existing.caseId || args.classification !== "clarification") {
        return { action: "duplicate" as const };
      }
      const caseMessages = await ctx.db
        .query("messages")
        .withIndex("by_case", (q) => q.eq("caseId", existing.caseId))
        .collect();
      return caseMessages.some(
        (message) =>
          message.direction === "outbound" && message.deliveryStatus === "sent",
      )
        ? { action: "duplicate" as const }
        : { action: "clarification" as const, caseId: existing.caseId };
    }

    if (args.classification === "unrelated") {
      await ctx.db.insert("messages", {
        providerId: args.providerId,
        threadId: args.threadId,
        messageIdHeader: args.messageIdHeader,
        direction: "inbound",
        party: "customer",
        from: args.from,
        to: args.to,
        subject: args.subject,
        text: args.text,
        hasAttachments: args.hasAttachments,
        sentAt: args.sentAt,
        deliveryStatus: "ignored_unrelated",
      });
      return { action: "ignored" as const };
    }

    if (args.classification === "wismo") {
      const messageId = await ctx.db.insert("messages", {
        providerId: args.providerId,
        threadId: args.threadId,
        messageIdHeader: args.messageIdHeader,
        direction: "inbound",
        party: "customer",
        from: args.from,
        to: args.to,
        subject: args.subject,
        text: args.text,
        hasAttachments: args.hasAttachments,
        sentAt: args.sentAt,
      });
      const now = Date.now();
      const caseId = await ctx.db.insert("cases", {
        sourceMessageId: messageId,
        status: "received",
        identityAttempts: 0,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.patch(messageId, { caseId });
      await recordCaseEvent(ctx, {
        caseId,
        type: "email_received",
        summary: `Received Gmail message “${args.subject}”`,
        contextSource: "gmail",
      });
      const activeImport = await ctx.db
        .query("orderImports")
        .withIndex("by_active", (q) => q.eq("active", true))
        .unique();
      const email = senderEmail(args.from);
      const reference = orderReference(args.subject, args.text);
      const candidates = activeImport && email
        ? await ctx.db.query("csvOrders").withIndex("by_import_email", (q) => q.eq("importId", activeImport._id).eq("customerEmail", email)).collect()
        : [];
      const matches = reference ? candidates.filter((order) => order.orderId === reference) : candidates;
      const order = matches.length === 1 ? matches[0] : null;
      const fresh = order && Date.now() - Date.parse(order.statusUpdatedAt) <= 24 * 60 * 60 * 1_000 && Date.parse(order.statusUpdatedAt) <= Date.now();
      if (!order || !fresh) {
        await ctx.db.patch(caseId, { status: "order_needed", updatedAt: Date.now() });
        await recordCaseEvent(ctx, {
          caseId,
          type: order ? "csv_order_stale" : "csv_order_clarification_needed",
          summary: order
            ? "The matching CSV status is older than 24 hours."
            : "No single CSV order safely matched the sender and order reference.",
          contextSource: "orders.csv",
        });
        return { action: "clarification" as const, caseId };
      }
      await ctx.db.patch(caseId, { status: "investigating", updatedAt: Date.now() });
      await recordCaseEvent(ctx, {
        caseId,
        type: "csv_order_matched",
        summary: `Matched order #${order.orderId} from the active CSV snapshot.`,
        contextSource: "orders.csv",
        toolName: "find_orders",
        toolResult: { orderId: order.orderId, statusUpdatedAt: order.statusUpdatedAt },
      });
      return {
        action: "status_reply" as const,
        caseId,
        text: statusReply(order),
        orderId: order.orderId,
      };
    }

    const messageId = await ctx.db.insert("messages", {
      providerId: args.providerId,
      threadId: args.threadId,
      messageIdHeader: args.messageIdHeader,
      direction: "inbound",
      party: "customer",
      from: args.from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      hasAttachments: args.hasAttachments,
      sentAt: args.sentAt,
    });
    const now = Date.now();
    const caseId = await ctx.db.insert("cases", {
      sourceMessageId: messageId,
      status: "order_needed",
      identityAttempts: 0,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(messageId, { caseId });
    await recordCaseEvent(ctx, {
      caseId,
      type: "clarification_pending",
      summary:
        "The delivery request was empty or unclear; a safe clarification is pending.",
      contextSource: "gmail",
    });
    return { action: "clarification" as const, caseId };
  },
});

export const completeClarification = internalMutation({
  args: {
    caseId: v.id("cases"),
    providerId: v.string(),
    threadId: v.string(),
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("messages")
      .withIndex("by_provider_id", (q) => q.eq("providerId", args.providerId))
      .unique();
    if (existing) return;
    const now = Date.now();
    await ctx.db.insert("messages", {
      providerId: args.providerId,
      threadId: args.threadId,
      direction: "outbound",
      party: "support",
      from: args.from,
      to: [args.to],
      subject: args.subject,
      text: args.text,
      hasAttachments: false,
      sentAt: now,
      deliveryStatus: "sent",
      caseId: args.caseId,
    });
    await recordCaseEvent(ctx, {
      caseId: args.caseId,
      type: "clarification_sent",
      summary:
        "Asked the customer for their order number and delivery question.",
      contextSource: "gmail",
    });
    await ctx.db.patch(args.caseId, { firstActionAt: now, updatedAt: now });
  },
});

export const completeStatusReply = internalMutation({
  args: {
    caseId: v.id("cases"), providerId: v.string(), threadId: v.string(),
    from: v.string(), to: v.string(), subject: v.string(), text: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("messages").withIndex("by_provider_id", (q) => q.eq("providerId", args.providerId)).unique();
    if (existing) return;
    const now = Date.now();
    await ctx.db.insert("messages", {
      providerId: args.providerId, threadId: args.threadId, direction: "outbound",
      party: "support", from: args.from, to: [args.to], subject: args.subject,
      text: args.text, hasAttachments: false, sentAt: now, deliveryStatus: "sent",
      caseId: args.caseId,
    });
    await ctx.db.patch(args.caseId, { status: "closed", firstActionAt: now, resolvedAt: now, closedAt: now, updatedAt: now });
    await recordCaseEvent(ctx, {
      caseId: args.caseId,
      type: "csv_status_reply_sent",
      summary: `Sent the current CSV status for order #${args.orderId}.`,
      contextSource: "gmail,orders.csv",
      toolName: "gmail.messages.send",
      toolResult: { providerId: args.providerId, orderId: args.orderId },
    });
  },
});

export const listReceivedCases = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return [];
    const rows = (
      await Promise.all(
        (
          [
            "received",
            "investigating",
            "identity_needed",
            "order_needed",
            "awaiting_approval",
            "awaiting_courier",
            "human_attention",
          ] as const
        ).map((status) =>
          ctx.db
            .query("cases")
            .withIndex("by_status", (q) => q.eq("status", status))
            .order("desc")
            .take(10),
        ),
      )
    )
      .flat()
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, 10);
    return Promise.all(
      rows.map(async (item) => {
        const message = await ctx.db.get(item.sourceMessageId);
        const customer = item.customerId
          ? await ctx.db.get(item.customerId)
          : null;
        const orders = (
          await Promise.all(
            (item.candidateOrderIds ?? (item.orderId ? [item.orderId] : [])).map(
              (orderId) => ctx.db.get(orderId),
            ),
          )
        ).filter((order) => order !== null);
        const agentRuns = await ctx.db
          .query("agentRuns")
          .withIndex("by_case", (q) => q.eq("caseId", item._id))
          .collect();
        const latestAgentRun = agentRuns.sort(
          (left, right) => right.startedAt - left.startedAt,
        )[0];
        const approvals = await ctx.db
          .query("approvals")
          .withIndex("by_case", (q) => q.eq("caseId", item._id))
          .collect();
        const identityApproval = approvals.find(
          (approval) =>
            approval.kind === "customer_email" &&
            typeof approval.payload?.actionKey === "string" &&
            (approval.payload.actionKey.startsWith("identity-request:") ||
              approval.payload.actionKey.startsWith("order-selection:")),
        );
        const identityPayload = identityApproval?.payload as
          | { to?: unknown; subject?: unknown; text?: unknown }
          | undefined;
        const customerUpdateApproval = approvals.find(
          (approval) =>
            approval.kind === "customer_email" &&
            typeof approval.payload?.actionKey === "string" &&
            approval.payload.actionKey.startsWith("tracking-update:"),
        );
        const customerUpdatePayload = customerUpdateApproval?.payload as
          | { to?: unknown; subject?: unknown; text?: unknown }
          | undefined;
        const shopifyApproval = approvals.find((approval) => approval.kind === "shopify_note");
        const shopifyPayload = shopifyApproval?.payload as { note?: unknown } | undefined;
        const contactAttempt = await ctx.db.query("contactAttempts").withIndex("by_case", (q) => q.eq("caseId", item._id)).first();
        const courierContact = contactAttempt ? await ctx.db.get(contactAttempt.contactId) : null;
        const courierReply = contactAttempt?.replyMessageId ? await ctx.db.get(contactAttempt.replyMessageId) : null;
        return message
          ? {
              id: item._id,
              createdAt: item.createdAt,
              providerId: message.providerId,
              threadId: message.threadId,
              from: message.from,
              subject: message.subject,
              text: message.text,
              status: item.status,
              agentRunStatus: latestAgentRun?.status ?? null,
              escalationReason: item.escalationReason ?? null,
              recommendation: item.recommendation ?? null,
              responseDeadlineAt: item.responseDeadlineAt ?? null,
              escalatedAt: item.escalatedAt ?? null,
              guidance: item.guidance ?? null,
              customer: customer
                ? {
                    name: customer.name ?? customer.email,
                    email: customer.email,
                  }
                : null,
              orders: orders.map((order) => ({
                id: order._id,
                name: order.name,
                createdAt: order.createdAt,
                lineItems: order.lineItems,
                fulfillmentStatus: order.fulfillmentStatus,
                trackingNumber: order.trackingNumber,
                trackingUrl: order.trackingUrl,
              })),
              identityRequest:
                identityApproval &&
                typeof identityPayload?.to === "string" &&
                typeof identityPayload.subject === "string" &&
                typeof identityPayload.text === "string"
                  ? {
                      approvalId: identityApproval._id,
                      status: identityApproval.status,
                      to: identityPayload.to,
                      subject: identityPayload.subject,
                      text: identityPayload.text,
                    }
                  : null,
              customerUpdate:
                customerUpdateApproval &&
                typeof customerUpdatePayload?.to === "string" &&
                typeof customerUpdatePayload.subject === "string" &&
                typeof customerUpdatePayload.text === "string"
                  ? {
                      approvalId: customerUpdateApproval._id,
                      status: customerUpdateApproval.status,
                      proposedAt: customerUpdateApproval.proposedAt,
                      to: customerUpdatePayload.to,
                      subject: customerUpdatePayload.subject,
                      text: customerUpdatePayload.text,
                    }
                  : null,
              courierState: contactAttempt ? {
                contactName: courierContact?.name ?? "Courier",
                waiting: !courierReply,
                replyText: courierReply?.text ?? null,
                attemptCount: contactAttempt.attemptNumber,
              } : null,
              shopifyUpdate:
                shopifyApproval && typeof shopifyPayload?.note === "string"
                  ? { approvalId: shopifyApproval._id, status: shopifyApproval.status, proposedAt: shopifyApproval.proposedAt, note: shopifyPayload.note }
                  : null,
            }
          : null;
      }),
    ).then((items) => items.filter((item) => item !== null));
  },
});
