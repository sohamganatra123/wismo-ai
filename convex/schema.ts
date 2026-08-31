import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const role = v.union(v.literal("founder"), v.literal("support_agent"));
const caseStatus = v.union(
  v.literal("received"), v.literal("classifying"), v.literal("identity_needed"),
  v.literal("order_needed"), v.literal("investigating"), v.literal("awaiting_approval"),
  v.literal("awaiting_courier"), v.literal("human_attention"),
  v.literal("delivery_confirmed"), v.literal("closed"),
);
const actionKind = v.union(
  v.literal("customer_email"), v.literal("courier_email"),
  v.literal("shopify_note"), v.literal("shopify_tracking"),
);

export default defineSchema({
  ...authTables,
  profiles: defineTable({ userId: v.id("users"), email: v.string(), name: v.string(), role, createdAt: v.number() })
    .index("by_user", ["userId"]).index("by_email", ["email"]),
  invites: defineTable({ email: v.string(), role, tokenHash: v.string(), invitedBy: v.id("users"), expiresAt: v.number(), acceptedAt: v.optional(v.number()) })
    .index("by_email", ["email"]).index("by_token", ["tokenHash"]),
  integrations: defineTable({ kind: v.union(v.literal("gmail"), v.literal("shopify")), accountLabel: v.string(), encryptedCredentials: v.string(), cursor: v.optional(v.string()), connectedBy: v.id("users"), updatedAt: v.number() })
    .index("by_kind", ["kind"]),
  oauthStates: defineTable({ stateHash: v.string(), userId: v.id("users"), provider: v.literal("gmail"), expiresAt: v.number(), usedAt: v.optional(v.number()) })
    .index("by_state_hash", ["stateHash"]),
  contacts: defineTable({ name: v.string(), email: v.string(), type: v.union(v.literal("courier"), v.literal("vendor")), active: v.boolean(), createdBy: v.id("users") })
    .index("by_email", ["email"]),
  customers: defineTable({ shopifyCustomerId: v.optional(v.string()), name: v.optional(v.string()), email: v.string(), phone: v.optional(v.string()), shippingAddress: v.optional(v.string()), deletedAt: v.optional(v.number()), updatedAt: v.number() })
    .index("by_email", ["email"]).index("by_shopify_id", ["shopifyCustomerId"]),
  orders: defineTable({ customerId: v.id("customers"), shopifyOrderId: v.string(), name: v.string(), createdAt: v.string(), lineItems: v.array(v.string()), fulfillmentStatus: v.string(), trackingNumber: v.optional(v.string()), trackingUrl: v.optional(v.string()), snapshotAt: v.number() })
    .index("by_customer", ["customerId"]).index("by_shopify_id", ["shopifyOrderId"]),
  trackingScans: defineTable({ orderId: v.id("orders"), trackingNumber: v.string(), status: v.string(), eventTime: v.string(), location: v.optional(v.string()), description: v.optional(v.string()), source: v.string(), recordedAt: v.number() })
    .index("by_order", ["orderId"]).index("by_tracking", ["trackingNumber"]),
  messages: defineTable({ providerId: v.string(), threadId: v.string(), direction: v.union(v.literal("inbound"), v.literal("outbound")), party: v.union(v.literal("customer"), v.literal("courier"), v.literal("support")), from: v.string(), to: v.array(v.string()), subject: v.string(), text: v.string(), hasAttachments: v.boolean(), sentAt: v.number(), deliveryStatus: v.optional(v.string()), caseId: v.optional(v.id("cases")) })
    .index("by_provider_id", ["providerId"]).index("by_thread", ["threadId"]).index("by_case", ["caseId"]),
  cases: defineTable({ customerId: v.optional(v.id("customers")), orderId: v.optional(v.id("orders")), sourceMessageId: v.id("messages"), status: caseStatus, ownerId: v.optional(v.id("users")), escalationReason: v.optional(v.string()), recommendation: v.optional(v.string()), responseDeadlineAt: v.optional(v.number()), identityAttempts: v.number(), firstActionAt: v.optional(v.number()), resolvedAt: v.optional(v.number()), closedAt: v.optional(v.number()), createdAt: v.number(), updatedAt: v.number() })
    .index("by_status", ["status"]).index("by_customer_order", ["customerId", "orderId"]).index("by_owner", ["ownerId"]),
  caseLinks: defineTable({ caseId: v.id("cases"), linkedCaseId: v.id("cases"), reason: v.string() })
    .index("by_case", ["caseId"]),
  contactAttempts: defineTable({ caseId: v.id("cases"), contactId: v.id("contacts"), attemptNumber: v.number(), messageId: v.optional(v.id("messages")), scheduledAt: v.number(), sentAt: v.optional(v.number()), replyMessageId: v.optional(v.id("messages")) })
    .index("by_case", ["caseId"]).index("by_scheduled", ["scheduledAt"]),
  approvals: defineTable({ caseId: v.id("cases"), actionKey: v.string(), kind: actionKind, revision: v.number(), payload: v.any(), status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("executing"), v.literal("completed"), v.literal("failed")), proposedAt: v.number(), decidedAt: v.optional(v.number()), decidedBy: v.optional(v.id("users")), executedAt: v.optional(v.number()), error: v.optional(v.string()) })
    .index("by_case", ["caseId"]).index("by_action_key", ["actionKey"]),
  events: defineTable({ caseId: v.id("cases"), type: v.string(), summary: v.string(), contextSource: v.optional(v.string()), toolName: v.optional(v.string()), toolInput: v.optional(v.any()), toolResult: v.optional(v.any()), error: v.optional(v.string()), actorUserId: v.optional(v.id("users")), createdAt: v.number() })
    .index("by_case", ["caseId"]),
  memories: defineTable({ guidance: v.string(), proposedBy: v.id("users"), status: v.union(v.literal("proposed"), v.literal("approved"), v.literal("rejected")), approvedBy: v.optional(v.id("users")), createdAt: v.number(), decidedAt: v.optional(v.number()) })
    .index("by_status", ["status"]),
  rules: defineTable({ title: v.string(), guidance: v.string(), active: v.boolean(), createdBy: v.id("users"), updatedAt: v.number() })
    .index("by_active", ["active"]),
  anonymousTotals: defineTable({ day: v.string(), received: v.number(), resolved: v.number(), escalated: v.number(), firstActionTotalMs: v.number(), resolutionTotalMs: v.number(), expiresAt: v.number() })
    .index("by_day", ["day"]).index("by_expiry", ["expiresAt"]),
});
