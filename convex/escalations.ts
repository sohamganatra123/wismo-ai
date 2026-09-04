import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { recordCaseEvent } from "./lib/caseEvents";
import { assignEscalationDeadline } from "./lib/escalations";

async function requireManagerUserId(
  ctx: Parameters<typeof getAuthUserId>[0],
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in required");
  return userId;
}

export const assignOwner = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const userId = await requireManagerUserId(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Manager access required");
    const item = await ctx.db.get(args.caseId);
    if (!item) throw new Error("Case not found");
    const now = Date.now();
    await ctx.db.patch(args.caseId, {
      ownerId: userId,
      ...(!item.responseDeadlineAt ? assignEscalationDeadline(now) : {}),
      updatedAt: now,
    });
    await recordCaseEvent(ctx, {
      caseId: args.caseId,
      type: "escalation_owner_assigned",
      summary: `${profile.name} took ownership of this escalated case.`,
      contextSource: "manager",
      actorUserId: userId,
    });
    return { ownerId: userId };
  },
});

export const runDueEscalations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const escalated = await ctx.db
      .query("cases")
      .withIndex("by_status", (q) => q.eq("status", "human_attention"))
      .collect();

    let reminded = 0;
    let finalReminded = 0;
    for (const item of escalated) {
      if (
        item.ownerId &&
        item.escalationOwnerReminderAt &&
        item.escalationOwnerReminderAt <= now
      ) {
        await recordCaseEvent(ctx, {
          caseId: item._id,
          type: "escalation_owner_reminded",
          summary: "The assigned support agent missed the one-hour deadline.",
          contextSource: "system",
          actorUserId: item.ownerId,
        });
        await ctx.db.patch(item._id, {
          escalationOwnerReminderAt: undefined,
          updatedAt: now,
        });
        reminded += 1;
      }
      if (item.finalReminderAt && item.finalReminderAt <= now) {
        await recordCaseEvent(ctx, {
          caseId: item._id,
          type: "escalation_final_reminder",
          summary: "Founder alert and final reminder triggered 20 minutes after the missed deadline.",
          contextSource: "system",
        });
        await ctx.db.patch(item._id, {
          finalReminderAt: undefined,
          updatedAt: now,
        });
        finalReminded += 1;
      }
    }

    return { reminded, finalReminded };
  },
});
