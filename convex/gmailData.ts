import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

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

export const prepareInbound = internalMutation({
  args: {
    providerId: v.string(),
    threadId: v.string(),
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
      await ctx.db.insert("events", {
        caseId,
        type: "email_received",
        summary: `Received Gmail message “${args.subject}”`,
        contextSource: "gmail",
        createdAt: now,
      });
      return { action: "created" as const, caseId };
    }

    const messageId = await ctx.db.insert("messages", {
      providerId: args.providerId,
      threadId: args.threadId,
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
    await ctx.db.insert("events", {
      caseId,
      type: "clarification_pending",
      summary:
        "The delivery request was empty or unclear; a safe clarification is pending.",
      contextSource: "gmail",
      createdAt: now,
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
    await ctx.db.insert("events", {
      caseId: args.caseId,
      type: "clarification_sent",
      summary:
        "Asked the customer for their order number and delivery question.",
      contextSource: "gmail",
      createdAt: now,
    });
    await ctx.db.patch(args.caseId, { firstActionAt: now, updatedAt: now });
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
    const rows = await ctx.db
      .query("cases")
      .withIndex("by_status", (q) => q.eq("status", "received"))
      .order("desc")
      .take(10);
    return Promise.all(
      rows.map(async (item) => {
        const message = await ctx.db.get(item.sourceMessageId);
        return message
          ? {
              id: item._id,
              createdAt: item.createdAt,
              providerId: message.providerId,
              threadId: message.threadId,
              from: message.from,
              subject: message.subject,
              text: message.text,
            }
          : null;
      }),
    ).then((items) => items.filter((item) => item !== null));
  },
});
