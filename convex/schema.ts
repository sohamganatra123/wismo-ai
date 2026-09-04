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
const agentToolName = v.union(
  v.literal("read_case_context"),
  v.literal("match_shopify_customer"),
  v.literal("select_only_order"),
  v.literal("collect_order_evidence"),
  v.literal("prepare_customer_update"),
  v.literal("prepare_identity_request"),
  v.literal("prepare_courier_request"),
  v.literal("escalate_case"),
);
const safeTrackingResult = v.object({
  status: v.string(),
  eventTime: v.string(),
  source: v.string(),
});
const safeAgentToolResult = v.object({
  status: v.string(),
  summary: v.optional(v.string()),
  reason: v.optional(v.string()),
  recommendation: v.optional(v.string()),
  identityMatched: v.optional(v.boolean()),
  orderResolved: v.optional(v.boolean()),
  orderCount: v.optional(v.number()),
  orderName: v.optional(v.string()),
  lineItems: v.optional(v.array(v.string())),
  fulfillmentStatus: v.optional(v.string()),
  trackingNumber: v.optional(v.string()),
  latestTracking: v.optional(safeTrackingResult),
  hasConflict: v.optional(v.boolean()),
  actionKey: v.optional(v.string()),
  blocked: v.optional(v.boolean()),
});

export default defineSchema({
  ...authTables,
  profiles: defineTable({ userId: v.id("users"), email: v.string(), name: v.string(), role, createdAt: v.number() })
    .index("by_user", ["userId"]).index("by_email", ["email"]),
  invites: defineTable({ email: v.string(), role, tokenHash: v.string(), invitedBy: v.id("users"), expiresAt: v.number(), acceptedAt: v.optional(v.number()) })
    .index("by_email", ["email"]).index("by_token", ["tokenHash"]),
  waitlistLeads: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    source: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),
  integrations: defineTable({ kind: v.union(v.literal("gmail"), v.literal("shopify")), accountLabel: v.string(), encryptedCredentials: v.string(), cursor: v.optional(v.string()), connectedBy: v.id("users"), updatedAt: v.number() })
    .index("by_kind", ["kind"]),
  orderImports: defineTable({ filename: v.string(), rowCount: v.number(), active: v.boolean(), importedBy: v.id("users"), importedAt: v.number() })
    .index("by_active", ["active"]),
  csvOrders: defineTable({ importId: v.id("orderImports"), orderId: v.string(), customerEmail: v.string(), customerName: v.string(), status: v.string(), trackingNumber: v.optional(v.string()), carrier: v.optional(v.string()), statusUpdatedAt: v.string(), lineItems: v.array(v.string()) })
    .index("by_import", ["importId"])
    .index("by_import_email", ["importId", "customerEmail"])
    .index("by_import_order", ["importId", "orderId"]),
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
  investigations: defineTable({
    caseId: v.id("cases"),
    orderId: v.id("orders"),
    previousMessages: v.array(v.object({ messageId: v.id("messages"), subject: v.string(), text: v.string(), sentAt: v.number() })),
    fulfillmentStatus: v.string(),
    latestTracking: v.optional(v.object({ trackingNumber: v.string(), status: v.string(), eventTime: v.string(), location: v.optional(v.string()), description: v.optional(v.string()) })),
    hasConflict: v.optional(v.boolean()),
    collectedAt: v.number(),
  }).index("by_case", ["caseId"]),
  messages: defineTable({ providerId: v.string(), threadId: v.string(), messageIdHeader: v.optional(v.string()), direction: v.union(v.literal("inbound"), v.literal("outbound")), party: v.union(v.literal("customer"), v.literal("courier"), v.literal("support")), from: v.string(), to: v.array(v.string()), subject: v.string(), text: v.string(), hasAttachments: v.boolean(), sentAt: v.number(), deliveryStatus: v.optional(v.string()), caseId: v.optional(v.id("cases")) })
    .index("by_provider_id", ["providerId"]).index("by_thread", ["threadId"]).index("by_case", ["caseId"]),
  cases: defineTable({ customerId: v.optional(v.id("customers")), orderId: v.optional(v.id("orders")), candidateOrderIds: v.optional(v.array(v.id("orders"))), sourceMessageId: v.id("messages"), status: caseStatus, ownerId: v.optional(v.id("users")), escalationReason: v.optional(v.string()), recommendation: v.optional(v.string()), responseDeadlineAt: v.optional(v.number()), escalatedAt: v.optional(v.number()), escalationOwnerReminderAt: v.optional(v.number()), finalReminderAt: v.optional(v.number()), guidance: v.optional(v.string()), identityAttempts: v.number(), firstActionAt: v.optional(v.number()), resolvedAt: v.optional(v.number()), closedAt: v.optional(v.number()), createdAt: v.number(), updatedAt: v.number() })
    .index("by_status", ["status"]).index("by_source_message", ["sourceMessageId"]).index("by_customer_order", ["customerId", "orderId"]).index("by_owner", ["ownerId"]),
    caseLinks: defineTable({ caseId: v.id("cases"), linkedCaseId: v.id("cases"), reason: v.string() })
    .index("by_case", ["caseId"]),
  contactAttempts: defineTable({ caseId: v.id("cases"), contactId: v.id("contacts"), attemptNumber: v.number(), messageId: v.optional(v.id("messages")), scheduledAt: v.number(), sentAt: v.optional(v.number()), replyMessageId: v.optional(v.id("messages")) })
    .index("by_case", ["caseId"]).index("by_scheduled", ["scheduledAt"]),
  approvals: defineTable({ caseId: v.id("cases"), actionKey: v.string(), kind: actionKind, revision: v.number(), payload: v.any(), status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("executing"), v.literal("completed"), v.literal("failed")), decisionSource: v.optional(v.union(v.literal("manager"), v.literal("agent_policy"))), proposedAt: v.number(), decidedAt: v.optional(v.number()), decidedBy: v.optional(v.id("users")), executedAt: v.optional(v.number()), error: v.optional(v.string()) })
    .index("by_case", ["caseId"]).index("by_action_key", ["actionKey"]),
  events: defineTable({ caseId: v.id("cases"), type: v.string(), summary: v.string(), contextSource: v.optional(v.string()), toolName: v.optional(v.string()), toolInput: v.optional(v.any()), toolResult: v.optional(v.any()), error: v.optional(v.string()), actorUserId: v.optional(v.id("users")), createdAt: v.number() })
    .index("by_case", ["caseId"]),
  memories: defineTable({ guidance: v.string(), proposedBy: v.id("users"), status: v.union(v.literal("proposed"), v.literal("approved"), v.literal("rejected")), scope: v.literal("case_guidance"), caseId: v.optional(v.id("cases")), ruleId: v.optional(v.id("rules")), decidedBy: v.optional(v.id("users")), createdAt: v.number(), decidedAt: v.optional(v.number()) })
    .index("by_status", ["status"]).index("by_case", ["caseId"]),
  rules: defineTable({ title: v.string(), guidance: v.string(), active: v.boolean(), createdBy: v.id("users"), updatedAt: v.number() })
    .index("by_active", ["active"]),
  agentPolicies: defineTable({
    mode: v.union(v.literal("investigate"), v.literal("approval"), v.literal("verified")),
    active: v.boolean(),
    proofId: v.optional(v.id("onboardingProofs")),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_active", ["active"]),
  onboardingProofs: defineTable({
    createdBy: v.id("users"),
    status: v.union(v.literal("queued"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    createdAt: v.number(),
  }),
  agentRuns: defineTable({
    caseId: v.optional(v.id("cases")),
    proofId: v.optional(v.id("onboardingProofs")),
    trigger: v.union(
      v.literal("inbound"),
      v.literal("courier_reply"),
      v.literal("retry"),
      v.literal("onboarding_proof"),
    ),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("waiting"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("escalated"),
    ),
    round: v.number(),
    attempt: v.number(),
    leaseVersion: v.number(),
    leaseExpiresAt: v.optional(v.number()),
    nextRunAt: v.optional(v.number()),
    previousResponseId: v.optional(v.string()),
    pendingCalls: v.array(v.object({
      callId: v.string(),
      name: agentToolName,
      arguments: v.any(),
    })),
    pendingToolOutputs: v.array(v.object({
      callId: v.string(),
      name: agentToolName,
      result: safeAgentToolResult,
    })),
    inputTokens: v.number(),
    outputTokens: v.number(),
    startedAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    finalText: v.optional(v.string()),
    recommendation: v.optional(v.string()),
  })
    .index("by_case", ["caseId"])
    .index("by_proof", ["proofId"])
    .index("by_status", ["status"])
    .index("by_status_next_run", ["status", "nextRunAt"]),
  agentSteps: defineTable({
    runId: v.id("agentRuns"),
    sequence: v.number(),
    kind: v.union(v.literal("model"), v.literal("tool"), v.literal("policy")),
    name: v.string(),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("blocked"),
    ),
    input: v.optional(v.any()),
    output: v.optional(v.any()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_run", ["runId"]),
  agentToolResults: defineTable({
    runId: v.id("agentRuns"),
    callId: v.string(),
    name: agentToolName,
    result: safeAgentToolResult,
    createdAt: v.number(),
  }).index("by_run_call", ["runId", "callId"]),
  anonymousTotals: defineTable({ day: v.string(), received: v.number(), resolved: v.number(), escalated: v.number(), firstActionTotalMs: v.number(), resolutionTotalMs: v.number(), expiresAt: v.number() })
    .index("by_day", ["day"]).index("by_expiry", ["expiresAt"]),
});
