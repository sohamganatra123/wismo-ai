import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const row = v.object({
  orderId: v.string(),
  customerEmail: v.string(),
  customerName: v.string(),
  status: v.string(),
  trackingNumber: v.optional(v.string()),
  carrier: v.optional(v.string()),
  statusUpdatedAt: v.string(),
  lineItems: v.array(v.string()),
});

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

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireFounder(ctx);
    const active = await ctx.db
      .query("orderImports")
      .withIndex("by_active", (q) => q.eq("active", true))
      .unique();
    return active
      ? { id: active._id, filename: active.filename, rowCount: active.rowCount, importedAt: active.importedAt }
      : null;
  },
});

export const replace = mutation({
  args: { filename: v.string(), rows: v.array(row) },
  handler: async (ctx, args) => {
    const userId = await requireFounder(ctx);
    if (!args.filename.toLowerCase().endsWith(".csv")) throw new Error("Choose a CSV file");
    if (args.rows.length < 1 || args.rows.length > 1_000) throw new Error("Use between 1 and 1,000 orders");
    const seen = new Set<string>();
    const clean = args.rows.map((item, index) => {
      const orderId = item.orderId.trim().replace(/^#/, "").toUpperCase();
      const customerEmail = item.customerEmail.trim().toLowerCase();
      if (!orderId || seen.has(orderId)) throw new Error(`Row ${index + 2} has a missing or duplicate order ID`);
      seen.add(orderId);
      if (!/^\S+@\S+\.\S+$/.test(customerEmail)) throw new Error(`Row ${index + 2} has an invalid email`);
      if (!item.status.trim() || !Number.isFinite(Date.parse(item.statusUpdatedAt))) throw new Error(`Row ${index + 2} has an invalid status or time`);
      return {
        orderId,
        customerEmail,
        customerName: item.customerName.trim().slice(0, 200) || customerEmail,
        status: item.status.trim().slice(0, 200),
        trackingNumber: item.trackingNumber?.trim().slice(0, 200) || undefined,
        carrier: item.carrier?.trim().slice(0, 120) || undefined,
        statusUpdatedAt: new Date(item.statusUpdatedAt).toISOString(),
        lineItems: item.lineItems.slice(0, 20).map((value) => value.trim().slice(0, 200)).filter(Boolean),
      };
    });
    const now = Date.now();
    const importId = await ctx.db.insert("orderImports", {
      filename: args.filename.slice(0, 240),
      rowCount: clean.length,
      active: false,
      importedBy: userId,
      importedAt: now,
    });
    for (const item of clean) await ctx.db.insert("csvOrders", { importId, ...item });
    const imports = await ctx.db.query("orderImports").withIndex("by_active", (q) => q.eq("active", true)).collect();
    for (const previous of imports) await ctx.db.patch(previous._id, { active: false });
    await ctx.db.patch(importId, { active: true });
    return { importId, rowCount: clean.length };
  },
});
