import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const mode = v.union(
  v.literal("investigate"),
  v.literal("approval"),
  v.literal("verified"),
);

async function requireFounder(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in required");
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (profile?.role !== "founder") throw new Error("Founder access required");
  return userId;
}

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    await requireFounder(ctx);
    const policies = await ctx.db.query("agentPolicies").collect();
    return policies.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
  },
});

export const saveDraft = mutation({
  args: { mode },
  handler: async (ctx, args) => {
    const userId = await requireFounder(ctx);
    const policies = await ctx.db.query("agentPolicies").collect();
    const current = policies.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    const now = Date.now();
    const requestedMode = args.mode === "verified" ? "approval" : args.mode;
    if (current) {
      await ctx.db.patch(current._id, {
        mode: requestedMode,
        active: false,
        proofId: undefined,
        updatedAt: now,
      });
      return current._id;
    }
    return await ctx.db.insert("agentPolicies", {
      mode: requestedMode,
      active: false,
      createdBy: userId,
      updatedAt: now,
    });
  },
});

export const activate = mutation({
  args: { proofId: v.id("onboardingProofs"), confirmation: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await requireFounder(ctx);
    if (!args.confirmation) throw new Error("Explicit activation confirmation is required");
    const proof = await ctx.db.get(args.proofId);
    if (!proof || proof.createdBy !== userId || proof.status !== "completed") {
      throw new Error("A completed onboarding proof is required");
    }
    const policies = await ctx.db.query("agentPolicies").collect();
    const draft = policies.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (!draft) throw new Error("Save an autonomy policy before activation");
    for (const policy of policies) {
      if (policy.active) await ctx.db.patch(policy._id, { active: false, updatedAt: Date.now() });
    }
    await ctx.db.patch(draft._id, {
      mode: "verified",
      active: true,
      proofId: args.proofId,
      updatedAt: Date.now(),
    });
    return { active: true as const };
  },
});
