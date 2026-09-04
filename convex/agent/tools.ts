import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import type { Id } from "../_generated/dataModel";
import { internalMutation, type MutationCtx } from "../_generated/server";
import { customerUpdateDraft } from "../domain/customerUpdate";
import { identityRequestDraft } from "../domain/identityRequest";
import { orderSelectionRequestDraft } from "../domain/orderSelectionRequest";
import { collectForCaseInMutation } from "../investigations";
import { recordCaseEvent } from "../lib/caseEvents";
import { escalateCase } from "../lib/escalations";
import { assertLeaseWriteAllowed } from "./persistence";
import type {
  AgentSafeToolResult,
  AgentToolCall,
  AgentToolName,
} from "./contracts";
import { assertAgentSafeToolResult } from "./privacy";
import { validateApprovalReuse, validateToolReplay } from "./approvalReuse";
import { validateAgentToolArguments } from "./toolSchemas";
import { redactSensitiveText } from "./redaction";
import { evaluateAction } from "./policy";

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

const sendApprovedCustomerUpdate = makeFunctionReference<
  "action",
  { approvalId: Id<"approvals"> },
  void
>("customerUpdates:sendApproved");

function senderEmail(from: string) {
  return from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
}

function requiredString(args: Record<string, unknown>, name: string) {
  const value = args[name];
  if (typeof value !== "string") throw new Error(`Missing required tool argument: ${name}`);
  return value.trim();
}

async function caseInput(
  ctx: MutationCtx,
  runId: Id<"agentRuns">,
  expectedLeaseVersion: number,
) {
  const run = await ctx.db.get(runId);
  if (!run?.caseId) throw new Error("Case agent run not found");
  assertLeaseWriteAllowed(run, expectedLeaseVersion, Date.now());
  const item = await ctx.db.get(run.caseId);
  if (!item) throw new Error("Case not found");
  const source = await ctx.db.get(item.sourceMessageId);
  if (!source) throw new Error("Case source message not found");
  return { run, item, source };
}

async function pendingApproval(
  ctx: MutationCtx,
  input: {
    caseId: Id<"cases">;
    actionKey: string;
    kind: "customer_email" | "courier_email";
    payload: unknown;
    status?: "pending" | "approved";
  },
) {
  const existing = await ctx.db
    .query("approvals")
    .withIndex("by_action_key", (q) => q.eq("actionKey", input.actionKey))
    .unique();
  if (existing) {
    validateApprovalReuse(existing, input);
    return { id: existing._id, status: existing.status, created: false } as const;
  }
  const id = await ctx.db.insert("approvals", {
    caseId: input.caseId,
    actionKey: input.actionKey,
    kind: input.kind,
    payload: input.payload,
    revision: 1,
    status: input.status ?? "pending",
    ...(input.status === "approved" ? { decisionSource: "agent_policy" as const, decidedAt: Date.now() } : {}),
    proposedAt: Date.now(),
  });
  return { id, status: input.status ?? "pending", created: true } as const;
}

async function dispatchToolForCase(
  ctx: MutationCtx,
  input: {
    runId: Id<"agentRuns">;
    expectedLeaseVersion: number;
    call: AgentToolCall;
  },
): Promise<AgentSafeToolResult> {
  const { run, item, source } = await caseInput(
    ctx,
    input.runId,
    input.expectedLeaseVersion,
  );
  const args = validateAgentToolArguments(input.call.name, input.call.arguments);
  const pending = run.pendingCalls.find(
    (call) => call.callId === input.call.callId && call.name === input.call.name,
  );
  if (!pending) throw new Error("Agent tool call is not pending on this run");

  if (input.call.name === "read_case_context") {
    return {
      status: "completed",
      summary: `Case is ${item.status}; Shopify identity is ${item.customerId ? "matched" : "not matched"}; order is ${item.orderId ? "selected" : "not selected"}.`,
      identityMatched: Boolean(item.customerId),
      orderResolved: Boolean(item.orderId),
    };
  }

  if (input.call.name === "match_shopify_customer") {
    if (!item.customerId) {
      const outcomes = await ctx.db
        .query("events")
        .withIndex("by_case", (q) => q.eq("caseId", item._id))
        .collect();
      const shopifyError = outcomes.find(
        (event) =>
          event.type === "shopify_match_shopify_error" ||
          event.type === "shopify_match_not_connected",
      );
      return shopifyError
        ? {
            status: "error",
            summary: shopifyError.summary.slice(0, 2_000),
            identityMatched: false,
            blocked: true,
          }
        : {
            status: "not_found",
            summary: "No exact Shopify customer matched the fixed sender email.",
            identityMatched: false,
          };
    }
    const orders = (
      await Promise.all(
        (item.candidateOrderIds ?? (item.orderId ? [item.orderId] : [])).map(
          (orderId) => ctx.db.get(orderId),
        ),
      )
    ).filter((order) => order !== null);
    return {
      status: "matched",
      summary: `Exact Shopify customer match with ${orders.length} active order${orders.length === 1 ? "" : "s"}.`,
      identityMatched: true,
      orderResolved: orders.length === 1,
      orderCount: orders.length,
    };
  }

  if (input.call.name === "select_only_order") {
    if (!item.customerId) {
      return { status: "blocked", reason: "Shopify identity is not matched.", blocked: true };
    }
    const orders = (
      await Promise.all(
        (item.candidateOrderIds ?? (item.orderId ? [item.orderId] : [])).map(
          (orderId) => ctx.db.get(orderId),
        ),
      )
    ).filter((order) => order !== null);
    if (orders.length !== 1) {
      if (orders.length > 1) {
        const recipient = senderEmail(source.from);
        if (!recipient) {
          return { status: "blocked", reason: "Customer reply address is unavailable.", blocked: true };
        }
        const payload = orderSelectionRequestDraft({
          caseId: item._id,
          threadId: source.threadId,
          messageIdHeader: source.messageIdHeader,
          recipient,
          subject: source.subject,
          candidates: orders.slice(0, 10).map((order) => ({
            createdAt: order.createdAt,
            lineItems: order.lineItems,
          })),
        });
        const approval = await pendingApproval(ctx, {
          caseId: item._id,
          actionKey: payload.actionKey,
          kind: "customer_email",
          payload,
        });
        if (approval.status === "rejected" || approval.status === "failed") {
          return { status: "blocked", reason: `The stable order-selection request was already ${approval.status}.`, actionKey: payload.actionKey, blocked: true };
        }
        if (approval.status === "completed") {
          return { status: "already_completed", summary: "The stable order-selection request was already completed.", actionKey: payload.actionKey };
        }
        if (approval.created) {
          const now = Date.now();
          await ctx.db.patch(item._id, {
            status: "awaiting_approval",
            ...(item.firstActionAt ? {} : { firstActionAt: now }),
            updatedAt: now,
          });
          await recordCaseEvent(ctx, {
            caseId: item._id,
            type: "order_selection_request_prepared",
            summary: `Prepared ${orders.length} safe order choices for manager approval.`,
            contextSource: "gmail,shopify",
            toolName: input.call.name,
            toolResult: { actionKey: payload.actionKey, candidateCount: orders.length, decision: "approval" },
          });
        }
        return { status: "approval_required", summary: "Order-selection request is pending manager approval.", orderResolved: false, orderCount: orders.length, actionKey: payload.actionKey };
      }
      return {
        status: "not_found",
        summary: "No active order is available.",
        orderResolved: false,
        orderCount: orders.length,
        blocked: true,
      };
    }
    const order = orders[0];
    if (item.orderId !== order._id) {
      await ctx.db.patch(item._id, {
        orderId: order._id,
        status: "investigating",
        updatedAt: Date.now(),
      });
    }
    return {
      status: "selected",
      summary: `Selected the only active order, ${order.name}.`,
      orderResolved: true,
      orderCount: 1,
      orderName: redactSensitiveText(order.name).slice(0, 300),
      lineItems: order.lineItems
        .slice(0, 20)
        .map((line) => redactSensitiveText(line).slice(0, 300)),
      fulfillmentStatus: order.fulfillmentStatus.slice(0, 120),
      ...(order.trackingNumber ? { trackingNumber: order.trackingNumber.slice(0, 300) } : {}),
    };
  }

  if (input.call.name === "collect_order_evidence") {
    const evidence = await collectForCaseInMutation(ctx, { caseId: item._id });
    return {
      status: "completed",
      summary: `Collected Shopify fulfillment, ${evidence.previousMessages.length} prior customer message${evidence.previousMessages.length === 1 ? "" : "s"}, and ${evidence.latestTracking ? "one matching tracking update" : "no matching tracking update"}.`,
      orderResolved: true,
      orderName: redactSensitiveText(evidence.order.name).slice(0, 300),
      lineItems: evidence.order.lineItems
        .slice(0, 20)
        .map((line) => redactSensitiveText(line).slice(0, 300)),
      fulfillmentStatus: evidence.order.fulfillmentStatus.slice(0, 120),
      ...(evidence.order.trackingNumber
        ? { trackingNumber: evidence.order.trackingNumber.slice(0, 300) }
        : {}),
      ...(evidence.latestTracking
        ? {
            latestTracking: {
              status: evidence.latestTracking.status.slice(0, 120),
              eventTime: evidence.latestTracking.eventTime.slice(0, 120),
              source: "stored_tracking",
            },
          }
        : {}),
      hasConflict: evidence.hasConflict,
    };
  }

  if (input.call.name === "prepare_customer_update") {
    if (!item.orderId) throw new Error("Select one order before preparing a customer update");
    const order = await ctx.db.get(item.orderId);
    if (!order?.trackingNumber) {
      return { status: "blocked", reason: "Selected order has no tracking number.", blocked: true };
    }
    const investigation = await ctx.db
      .query("investigations")
      .withIndex("by_case", (q) => q.eq("caseId", item._id))
      .first();
    if (!investigation?.latestTracking) {
      return { status: "blocked", reason: "No matching tracking evidence is stored.", blocked: true };
    }
    if (investigation.hasConflict) {
      return {
        status: "blocked",
        reason: "Tracking evidence conflicts and requires escalation.",
        hasConflict: true,
        blocked: true,
      };
    }
    const recipient = senderEmail(source.from);
    if (!recipient) {
      return { status: "blocked", reason: "Customer reply address is unavailable.", blocked: true };
    }
    const generated = customerUpdateDraft({
      caseId: item._id,
      threadId: source.threadId,
      messageIdHeader: source.messageIdHeader,
      recipient,
      subject: source.subject,
      orderName: order.name,
      fulfillmentStatus: order.fulfillmentStatus,
      orderTrackingNumber: order.trackingNumber,
      latestTracking: investigation.latestTracking,
    });
    const modelPayload = { ...generated, text: requiredString(args, "draft") };
    const activePolicy = await ctx.db
      .query("agentPolicies")
      .withIndex("by_active", (q) => q.eq("active", true))
      .unique();
    const proof = activePolicy?.proofId ? await ctx.db.get(activePolicy.proofId) : null;
    const existingApproval = await ctx.db
      .query("approvals")
      .withIndex("by_action_key", (q) => q.eq("actionKey", modelPayload.actionKey))
      .unique();
    const scanTime = Date.parse(investigation.latestTracking.eventTime);
    const decision = evaluateAction({
      mode: activePolicy?.mode ?? "approval",
      proofComplete: proof?.status === "completed",
      kind: "customer_email",
      exactIdentity: Boolean(item.customerId),
      orderResolved: Boolean(item.orderId),
      exactTracking: investigation.latestTracking.trackingNumber === order.trackingNumber,
      unambiguousScan: Number.isFinite(scanTime) && scanTime > order.snapshotAt,
      hasConflict: Boolean(investigation.hasConflict),
      isCorrection: false,
      alreadyExecuted: existingApproval?.status === "completed" || existingApproval?.status === "executing",
      courierConfigured: false,
    });
    if (decision === "observe") {
      await recordCaseEvent(ctx, {
        caseId: item._id,
        type: "customer_update_observed",
        summary: "Prepared a recommendation without creating an external action.",
        contextSource: "gmail,shopify,tracking",
        toolName: input.call.name,
        toolResult: { actionKey: modelPayload.actionKey, decision },
      });
      return { status: "observed", summary: "Customer update recorded for investigation only.", actionKey: modelPayload.actionKey };
    }
    if (decision === "escalate") {
      await escalateCase(ctx, {
        caseId: item._id,
        escalationReason: "Verified action failed deterministic safety checks",
        recommendation: "Review identity, selected order, tracking evidence, and prior actions.",
        contextSource: "agent_policy",
        toolResult: { actionKey: modelPayload.actionKey, decision },
      });
      return { status: "escalated", reason: "Verified action failed safety checks.", actionKey: modelPayload.actionKey, blocked: true };
    }
    const payload = decision === "execute" ? generated : modelPayload;
    const approval = await pendingApproval(ctx, {
      caseId: item._id,
      actionKey: payload.actionKey,
      kind: "customer_email",
      payload,
      status: decision === "execute" ? "approved" : "pending",
    });
    if (approval.status === "rejected" || approval.status === "failed") {
      return {
        status: "blocked",
        reason: `The stable customer update was already ${approval.status}.`,
        actionKey: payload.actionKey,
        blocked: true,
      };
    }
    if (approval.status === "completed") {
      return {
        status: "already_completed",
        summary: "The stable customer update was already completed.",
        actionKey: payload.actionKey,
      };
    }
    if (!approval.created) {
      return {
        status: "approval_required",
        summary: "Customer update is already pending manager approval.",
        actionKey: payload.actionKey,
      };
    }
    const now = Date.now();
    await ctx.db.patch(item._id, {
      status: decision === "execute" ? "investigating" : "awaiting_approval",
      ...(item.firstActionAt ? {} : { firstActionAt: now }),
      updatedAt: now,
    });
    await recordCaseEvent(ctx, {
      caseId: item._id,
      type: "customer_update_prepared",
      summary: decision === "execute"
        ? "Verified a tracking update for automatic execution."
        : "Prepared a tracking update for manager approval.",
      contextSource: "gmail,shopify,tracking",
      toolName: input.call.name,
      toolResult: {
        actionKey: payload.actionKey,
        decision,
        reason: requiredString(args, "reason").slice(0, 2_000),
      },
    });
    if (decision === "execute") {
      await ctx.scheduler.runAfter(0, sendApprovedCustomerUpdate, { approvalId: approval.id });
      return {
        status: "approved_for_execution",
        summary: "Customer update passed verified policy and is ready for automatic execution.",
        actionKey: payload.actionKey,
      };
    }
    return {
      status: "approval_required",
      summary: "Customer update is pending manager approval.",
      actionKey: payload.actionKey,
    };
  }

  if (input.call.name === "prepare_identity_request") {
    if (item.customerId || item.orderId) {
      return {
        status: "blocked",
        reason: "Identity is already matched; a generic identity request is not allowed.",
        blocked: true,
      };
    }
    const recipient = senderEmail(source.from);
    if (!recipient) {
      return { status: "blocked", reason: "Customer reply address is unavailable.", blocked: true };
    }
    const payload = identityRequestDraft({
      caseId: item._id,
      threadId: source.threadId,
      messageIdHeader: source.messageIdHeader,
      recipient,
      subject: source.subject,
    });
    const approval = await pendingApproval(ctx, {
      caseId: item._id,
      actionKey: payload.actionKey,
      kind: "customer_email",
      payload,
    });
    if (approval.status === "rejected" || approval.status === "failed") {
      return {
        status: "blocked",
        reason: `The stable identity request was already ${approval.status}.`,
        actionKey: payload.actionKey,
        blocked: true,
      };
    }
    if (approval.status === "completed") {
      return {
        status: "already_completed",
        summary: "The stable identity request was already completed.",
        actionKey: payload.actionKey,
      };
    }
    if (!approval.created) {
      return {
        status: "approval_required",
        summary: "Identity request is already pending manager approval.",
        actionKey: payload.actionKey,
      };
    }
    const now = Date.now();
    await ctx.db.patch(item._id, {
      status: "awaiting_approval",
      ...(item.firstActionAt ? {} : { firstActionAt: now }),
      updatedAt: now,
    });
    await recordCaseEvent(ctx, {
      caseId: item._id,
      type: "identity_request_prepared",
      summary: "Prepared a checkout email and order number request for manager approval.",
      contextSource: "gmail,shopify",
      toolName: input.call.name,
      toolResult: { actionKey: payload.actionKey, decision: "approval" },
    });
    return {
      status: "approval_required",
      summary: "Identity request is pending manager approval.",
      actionKey: payload.actionKey,
    };
  }

  if (input.call.name === "prepare_courier_request") {
    if (!item.orderId) throw new Error("Select one order before preparing a courier request");
    const order = await ctx.db.get(item.orderId);
    if (!order?.trackingNumber) {
      return { status: "blocked", reason: "Selected order has no tracking number.", blocked: true };
    }
    const investigation = await ctx.db
      .query("investigations")
      .withIndex("by_case", (q) => q.eq("caseId", item._id))
      .first();
    if (!investigation) {
      return {
        status: "blocked",
        reason: "Collect order evidence before preparing a courier request.",
        blocked: true,
      };
    }
    if (investigation.hasConflict) {
      return {
        status: "blocked",
        reason: "Tracking evidence conflicts and requires escalation.",
        hasConflict: true,
        blocked: true,
      };
    }
    if (investigation.latestTracking) {
      return {
        status: "blocked",
        reason: "A matching tracking update already exists; prepare a customer update instead.",
        blocked: true,
      };
    }
    const contacts = (await ctx.db.query("contacts").collect()).filter(
      (contact) => contact.active && contact.type === "courier",
    );
    if (contacts.length !== 1) {
      return {
        status: "blocked",
        reason: "Exactly one active courier contact must be configured.",
        blocked: true,
      };
    }
    const contact = contacts[0];
    const actionKey = `courier-request:${item._id}:${order.trackingNumber}`;
    const payload = {
      actionKey,
      to: contact.email,
      subject: `Delivery evidence request for ${order.name}`,
      text: requiredString(args, "question"),
      orderName: order.name,
      trackingNumber: order.trackingNumber,
      contactId: contact._id,
    };
    const approval = await pendingApproval(ctx, {
      caseId: item._id,
      actionKey,
      kind: "courier_email",
      payload,
    });
    if (approval.status === "rejected" || approval.status === "failed") {
      return {
        status: "blocked",
        reason: `The stable courier request was already ${approval.status}.`,
        actionKey,
        blocked: true,
      };
    }
    if (approval.status === "completed") {
      return {
        status: "already_completed",
        summary: "The stable courier request was already completed.",
        actionKey,
      };
    }
    if (!approval.created) {
      return {
        status: "approval_required",
        summary: "Courier request is already pending manager approval.",
        actionKey,
      };
    }
    const now = Date.now();
    await ctx.db.patch(item._id, {
      status: "awaiting_approval",
      ...(item.firstActionAt ? {} : { firstActionAt: now }),
      updatedAt: now,
    });
    await recordCaseEvent(ctx, {
      caseId: item._id,
      type: "courier_request_prepared",
      summary: `Prepared a bounded courier request for ${contact.name} and manager approval.`,
      contextSource: "gmail,shopify",
      toolName: input.call.name,
      toolResult: { actionKey, decision: "approval" },
    });
    return {
      status: "approval_required",
      summary: "Courier request is pending manager approval.",
      actionKey,
    };
  }

  const reason = requiredString(args, "reason");
  const recommendation = requiredString(args, "recommendation");
  await escalateCase(ctx, {
    caseId: item._id,
    escalationReason: reason,
    recommendation,
    contextSource: "agent",
    toolName: input.call.name,
  });
  return { status: "escalated", reason, recommendation };
}

type DispatchToolArgs = {
  runId: Id<"agentRuns">;
  expectedLeaseVersion: number;
  call: AgentToolCall;
};

export async function dispatchToolInMutation(ctx: MutationCtx, args: DispatchToolArgs) {
    const { run } = await caseInput(ctx, args.runId, args.expectedLeaseVersion);
    const previous = await ctx.db
      .query("agentToolResults")
      .withIndex("by_run_call", (q) =>
        q.eq("runId", args.runId).eq("callId", args.call.callId),
      )
      .unique();
    if (previous) {
      return validateToolReplay(previous, args.call.name) as typeof previous.result;
    }
    const result = assertAgentSafeToolResult(
      await dispatchToolForCase(ctx, {
        runId: args.runId,
        expectedLeaseVersion: args.expectedLeaseVersion,
        call: {
          callId: args.call.callId,
          name: args.call.name,
          arguments: validateAgentToolArguments(args.call.name, args.call.arguments),
        },
      }),
    );
    await ctx.db.insert("agentToolResults", {
      runId: run._id,
      callId: args.call.callId,
      name: args.call.name,
      result,
      createdAt: Date.now(),
    });
    return result;
}

export const dispatchTool = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    expectedLeaseVersion: v.number(),
    call: v.object({
      callId: v.string(),
      name: agentToolName,
      arguments: v.any(),
    }),
  },
  handler: dispatchToolInMutation,
});

export const escalateRunCase = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    expectedLeaseVersion: v.number(),
    reason: v.string(),
    recommendation: v.string(),
  },
  handler: async (ctx, args) => {
    const { item } = await caseInput(
      ctx,
      args.runId,
      args.expectedLeaseVersion,
    );
    await escalateCase(ctx, {
      caseId: item._id,
      escalationReason: args.reason,
      recommendation: args.recommendation,
      contextSource: "agent",
    });
  },
});

export const mutatingProposalTools = new Set<AgentToolName>([
  "select_only_order",
  "prepare_customer_update",
  "prepare_identity_request",
  "prepare_courier_request",
]);
