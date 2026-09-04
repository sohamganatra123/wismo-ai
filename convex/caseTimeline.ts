import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

export const getCaseTimeline = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return null;

    const item = await ctx.db.get(args.caseId);
    if (!item) return null;

    const [sourceMessage, customer, order, events, approvals, messages, memories, owner] =
      await Promise.all([
        ctx.db.get(item.sourceMessageId),
        item.customerId ? ctx.db.get(item.customerId) : Promise.resolve(null),
        item.orderId ? ctx.db.get(item.orderId) : Promise.resolve(null),
        ctx.db.query("events").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect(),
        ctx.db.query("approvals").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect(),
        ctx.db.query("messages").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect(),
        ctx.db.query("memories").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect(),
        item.ownerId
          ? ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", item.ownerId!)).unique()
          : Promise.resolve(null),
      ]);

    return {
      case: item,
      sourceMessage,
      customer,
      order,
      owner: owner ? { name: owner.name, email: owner.email } : null,
      events: events.sort((left, right) => right.createdAt - left.createdAt),
      approvals: approvals.sort((left, right) => right.proposedAt - left.proposedAt),
      messages: messages.sort((left, right) => right.sentAt - left.sentAt),
      memories: memories.sort((left, right) => right.createdAt - left.createdAt),
    };
  },
});
