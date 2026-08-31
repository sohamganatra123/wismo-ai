import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

export const getConnection = internalQuery({ args: {}, handler: async (ctx) => ctx.db.query("integrations").withIndex("by_kind", (q) => q.eq("kind", "gmail")).unique() });
export const isFounder = internalQuery({ args: { userId: v.id("users") }, handler: async (ctx, args) => (await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", args.userId)).unique())?.role === "founder" });

export const advanceCursor = internalMutation({ args: { integrationId: v.id("integrations"), cursor: v.string() }, handler: async (ctx, args) => ctx.db.patch(args.integrationId, { cursor: args.cursor, updatedAt: Date.now() }) });

export const ingest = internalMutation({
  args: { providerId: v.string(), threadId: v.string(), from: v.string(), to: v.array(v.string()), subject: v.string(), text: v.string(), hasAttachments: v.boolean(), sentAt: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("messages").withIndex("by_provider_id", (q) => q.eq("providerId", args.providerId)).unique();
    if (existing) return { created: false, caseId: existing.caseId };
    const messageId = await ctx.db.insert("messages", { ...args, direction: "inbound", party: "customer" });
    const now = Date.now();
    const caseId = await ctx.db.insert("cases", { sourceMessageId: messageId, status: "received", identityAttempts: 0, createdAt: now, updatedAt: now });
    await ctx.db.patch(messageId, { caseId });
    await ctx.db.insert("events", { caseId, type: "email_received", summary: `Received Gmail message “${args.subject}”`, contextSource: "gmail", createdAt: now });
    return { created: true, caseId };
  },
});

export const listReceivedCases = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx); if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique(); if (!profile) return [];
    const rows = await ctx.db.query("cases").withIndex("by_status", (q) => q.eq("status", "received")).order("desc").take(10);
    return Promise.all(rows.map(async (item) => { const message = await ctx.db.get(item.sourceMessageId); return message ? { id: item._id, createdAt: item.createdAt, providerId: message.providerId, threadId: message.threadId, from: message.from, subject: message.subject, text: message.text } : null; })).then((items) => items.filter((item) => item !== null));
  },
});
