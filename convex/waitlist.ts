import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const join = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const name = args.name?.trim() || undefined;
    const company = args.company?.trim() || undefined;

    const existing = await ctx.db
      .query("waitlistLeads")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: name ?? existing.name,
        company: company ?? existing.company,
        updatedAt: Date.now(),
      });
      return { status: "existing" as const };
    }

    await ctx.db.insert("waitlistLeads", {
      email,
      name,
      company,
      source: "connect_page",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { status: "created" as const };
  },
});
