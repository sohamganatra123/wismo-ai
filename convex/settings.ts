import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

async function requireFounder(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in required");
  const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
  if (profile?.role !== "founder") throw new Error("Founder access required");
  return profile;
}

export const getFounderSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireFounder(ctx);
    const [contacts, rules] = await Promise.all([
      ctx.db.query("contacts").collect(),
      ctx.db.query("rules").collect(),
    ]);
    return { contacts, rules };
  },
});

export const addContact = mutation({
  args: { name: v.string(), email: v.string(), type: v.union(v.literal("courier"), v.literal("vendor")) },
  handler: async (ctx, args) => {
    const founder = await requireFounder(ctx);
    const email = args.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid contact email");
    if (!args.name.trim()) throw new Error("Enter a contact name");
    return await ctx.db.insert("contacts", { name: args.name.trim(), email, type: args.type, active: true, createdBy: founder.userId });
  },
});

export const addRule = mutation({
  args: { title: v.string(), guidance: v.string() },
  handler: async (ctx, args) => {
    const founder = await requireFounder(ctx);
    if (!args.title.trim() || !args.guidance.trim()) throw new Error("Enter a rule name and guidance");
    return await ctx.db.insert("rules", { title: args.title.trim(), guidance: args.guidance.trim(), active: true, createdBy: founder.userId, updatedAt: Date.now() });
  },
});
