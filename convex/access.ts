import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { normalizeEmail } from "./domain/access";
import { action, internalMutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";

async function requireProfile(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in required");
  const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
  if (!profile) throw new Error("WISMO profile not found");
  return profile;
}

export const currentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
  },
});

export const listTeam = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    if (profile.role !== "founder") throw new Error("Founder access required");
    const [profiles, invites] = await Promise.all([ctx.db.query("profiles").collect(), ctx.db.query("invites").collect()]);
    return { profiles, invites };
  },
});

export const createInviteRecord = internalMutation({
  args: { email: v.string(), tokenHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (profile.role !== "founder") throw new Error("Founder access required");
    const email = normalizeEmail(args.email);
    const existingProfile = await ctx.db.query("profiles").withIndex("by_email", (q) => q.eq("email", email)).unique();
    if (existingProfile) throw new Error("This person already has access");
    return await ctx.db.insert("invites", { email, role: "support_agent", tokenHash: args.tokenHash, invitedBy: profile.userId, expiresAt: args.expiresAt });
  },
});

export const createInvite = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const token = crypto.randomUUID() + crypto.randomUUID();
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
    const tokenHash = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await ctx.runMutation(internal.access.createInviteRecord, { email: args.email, tokenHash, expiresAt });
    return { token, expiresAt };
  },
});

export { requireProfile };
