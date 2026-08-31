import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { isValidOAuthState } from "./domain/oauthState";
import { internalMutation, query } from "./_generated/server";

export const getFounderIntegrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (profile?.role !== "founder") throw new Error("Founder access required");
    const rows = await ctx.db.query("integrations").collect();
    return rows.map(({ kind, accountLabel, updatedAt }) => ({ kind, accountLabel, updatedAt }));
  },
});

export const saveIntegration = internalMutation({
  args: { kind: v.union(v.literal("gmail"), v.literal("shopify")), accountLabel: v.string(), encryptedCredentials: v.string(), connectedBy: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("integrations").withIndex("by_kind", (q) => q.eq("kind", args.kind)).unique();
    const values = { accountLabel: args.accountLabel, encryptedCredentials: args.encryptedCredentials, connectedBy: args.connectedBy, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, values);
      return existing._id;
    }
    return await ctx.db.insert("integrations", { kind: args.kind, ...values });
  },
});

export const createOAuthState = internalMutation({
  args: { stateHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (profile?.role !== "founder") throw new Error("Founder access required");
    await ctx.db.insert("oauthStates", { stateHash: args.stateHash, userId, provider: "gmail", expiresAt: args.expiresAt });
    return userId;
  },
});

export const consumeOAuthState = internalMutation({
  args: { stateHash: v.string() },
  handler: async (ctx, args) => {
    const state = await ctx.db.query("oauthStates").withIndex("by_state_hash", (q) => q.eq("stateHash", args.stateHash)).unique();
    if (!state || !isValidOAuthState({ expected: state.stateHash, received: args.stateHash, expiresAt: state.expiresAt, now: Date.now(), usedAt: state.usedAt ?? null })) throw new Error("Invalid or expired Gmail connection request");
    await ctx.db.patch(state._id, { usedAt: Date.now() });
    return { userId: state.userId };
  },
});
