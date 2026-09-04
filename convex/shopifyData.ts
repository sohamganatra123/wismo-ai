import { v } from "convex/values";
import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { scheduleCaseAgentRun } from "./lib/agentScheduling";
import { recordCaseEvent } from "./lib/caseEvents";
import { matchedShopifyTransition } from "./domain/agentJourney";

export const getMatchInput = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.caseId);
    if (!item) return null;
    const message = await ctx.db.get(item.sourceMessageId);
    const connection = await ctx.db
      .query("integrations")
      .withIndex("by_kind", (q) => q.eq("kind", "shopify"))
      .unique();
    return message ? { item, message, connection } : null;
  },
});

const orderSnapshot = v.object({
  shopifyOrderId: v.string(),
  name: v.string(),
  createdAt: v.string(),
  lineItems: v.array(v.string()),
  fulfillmentStatus: v.string(),
  trackingNumber: v.optional(v.string()),
  trackingUrl: v.optional(v.string()),
});

type SaveMatchArgs = {
  caseId: Id<"cases">;
  shopifyCustomerId: string;
  name: string;
  email: string;
  orders: Array<{
    shopifyOrderId: string;
    name: string;
    createdAt: string;
    lineItems: string[];
    fulfillmentStatus: string;
    trackingNumber?: string;
    trackingUrl?: string;
  }>;
};

export async function saveMatchInMutation(ctx: MutationCtx, args: SaveMatchArgs) {
    const now = Date.now();
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_shopify_id", (q) =>
        q.eq("shopifyCustomerId", args.shopifyCustomerId),
      )
      .unique();
    const customerId = existingCustomer
      ? existingCustomer._id
      : await ctx.db.insert("customers", {
          shopifyCustomerId: args.shopifyCustomerId,
          name: args.name,
          email: args.email,
          updatedAt: now,
        });
    if (existingCustomer) {
      await ctx.db.patch(existingCustomer._id, {
        name: args.name,
        email: args.email,
        updatedAt: now,
      });
    }

    const orderIds = [];
    for (const order of args.orders) {
      const existingOrder = await ctx.db
        .query("orders")
        .withIndex("by_shopify_id", (q) =>
          q.eq("shopifyOrderId", order.shopifyOrderId),
        )
        .unique();
      if (existingOrder) {
        await ctx.db.patch(existingOrder._id, {
          ...order,
          customerId,
          snapshotAt: now,
        });
        orderIds.push(existingOrder._id);
      } else {
        orderIds.push(
          await ctx.db.insert("orders", {
            ...order,
            customerId,
            snapshotAt: now,
          }),
        );
      }
    }

    const transition = matchedShopifyTransition(orderIds);
    await ctx.db.patch(args.caseId, {
      customerId,
      orderId: transition.orderId,
      candidateOrderIds: transition.candidateOrderIds,
      status: transition.status,
      updatedAt: now,
    });
    await recordCaseEvent(ctx, {
      caseId: args.caseId,
      type: "shopify_customer_matched",
      summary: `Matched ${args.email} to ${args.name} with ${orderIds.length} active order${orderIds.length === 1 ? "" : "s"}.`,
      contextSource: "shopify",
      toolName: "customerByIdentifier",
      toolInput: { email: args.email },
      toolResult: { activeOrderCount: orderIds.length },
    });
    await scheduleCaseAgentRun(ctx, { caseId: args.caseId, trigger: "inbound" });
}

export const saveMatch = internalMutation({
  args: {
    caseId: v.id("cases"),
    shopifyCustomerId: v.string(),
    name: v.string(),
    email: v.string(),
    orders: v.array(orderSnapshot),
  },
  handler: saveMatchInMutation,
});

export const recordOutcome = internalMutation({
  args: {
    caseId: v.id("cases"),
    outcome: v.union(
      v.literal("not_connected"),
      v.literal("shopify_error"),
    ),
    detail: v.string(),
  },
  handler: async (ctx, args) => {
    await recordCaseEvent(ctx, {
      caseId: args.caseId,
      type: `shopify_match_${args.outcome}`,
      summary: args.detail,
      contextSource: "shopify",
      ...(args.outcome === "shopify_error" ? { error: args.detail } : {}),
    });
    await scheduleCaseAgentRun(ctx, { caseId: args.caseId, trigger: "inbound" });
  },
});

export const recordNoMatchAndPrepareIdentityRequest = internalMutation({
  args: { caseId: v.id("cases"), detail: v.string() },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.caseId);
    if (!item) return;
    const now = Date.now();
    await ctx.db.patch(args.caseId, {
      customerId: undefined,
      orderId: undefined,
      candidateOrderIds: [],
      status: "identity_needed",
      escalationReason: "Sender did not match a Shopify customer",
      updatedAt: now,
    });
    await recordCaseEvent(ctx, {
      caseId: args.caseId,
      type: "shopify_customer_not_matched",
      summary: args.detail,
      contextSource: "shopify",
    });
    await scheduleCaseAgentRun(ctx, { caseId: args.caseId, trigger: "inbound" });
  },
});
