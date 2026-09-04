import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

async function requireProfile(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in required");
  const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
  if (!profile) throw new Error("WISMO profile not found");
  return profile;
}

async function requireFounder(ctx: QueryCtx | MutationCtx) {
  const profile = await requireProfile(ctx);
  if (profile.role !== "founder") throw new Error("Founder access required");
  return profile;
}

export const listFounderMemories = query({
  args: {},
  handler: async (ctx) => {
    await requireFounder(ctx);
    const [memories, profiles] = await Promise.all([
      ctx.db.query("memories").collect(),
      ctx.db.query("profiles").collect(),
    ]);
    const proposedByName = new Map(profiles.map((profile) => [profile.userId, profile.name]));
    return memories
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((memory) => ({
        ...memory,
        proposedByName: proposedByName.get(memory.proposedBy) ?? "Unknown manager",
      }));
  },
});

export const proposeMemory = mutation({
  args: { caseId: v.optional(v.id("cases")), guidance: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const guidance = args.guidance.trim();
    if (!guidance) throw new Error("Guidance is required");
    return await ctx.db.insert("memories", {
      guidance,
      proposedBy: profile.userId,
      status: "proposed",
      scope: "case_guidance",
      caseId: args.caseId,
      createdAt: Date.now(),
    });
  },
});

export const decideMemory = mutation({
  args: { memoryId: v.id("memories"), decision: v.union(v.literal("approved"), v.literal("rejected")) },
  handler: async (ctx, args) => {
    const founder = await requireFounder(ctx);
    const memory = await ctx.db.get(args.memoryId);
    if (!memory) throw new Error("Memory proposal not found");
    if (memory.status !== "proposed") throw new Error("This memory proposal was already reviewed");
    await ctx.db.patch(args.memoryId, {
      status: args.decision,
      decidedBy: founder.userId,
      decidedAt: Date.now(),
    });
    return null;
  },
});
