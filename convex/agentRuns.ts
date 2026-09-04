import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import type { AgentRoundState, AgentToolCall, AgentToolName } from "./agent/contracts";
import { assertLeaseWriteAllowed, persistExactToolBatch } from "./agent/persistence";
import {
  assertAgentModelContext,
  assertAgentSafeToolOutputs,
  assertAgentStepInput,
  assertAgentStepOutput,
} from "./agent/privacy";
import { redactSensitiveText, toAgentAuditInput } from "./agent/redaction";
import { validateAgentToolArguments } from "./agent/toolSchemas";
import { scheduleCaseAgentRun } from "./lib/agentScheduling";

const trigger = v.union(
  v.literal("inbound"), v.literal("courier_reply"),
  v.literal("retry"), v.literal("onboarding_proof"),
);
const stepKind = v.union(v.literal("model"), v.literal("tool"), v.literal("policy"));
const agentToolName = v.union(
  v.literal("read_case_context"), v.literal("match_shopify_customer"),
  v.literal("select_only_order"), v.literal("collect_order_evidence"),
  v.literal("prepare_customer_update"), v.literal("prepare_identity_request"),
  v.literal("prepare_courier_request"), v.literal("escalate_case"),
);
const safeAgentToolResult = v.object({
  status: v.string(), summary: v.optional(v.string()), reason: v.optional(v.string()),
  recommendation: v.optional(v.string()), identityMatched: v.optional(v.boolean()),
  orderResolved: v.optional(v.boolean()), orderCount: v.optional(v.number()),
  orderName: v.optional(v.string()), lineItems: v.optional(v.array(v.string())),
  fulfillmentStatus: v.optional(v.string()), trackingNumber: v.optional(v.string()),
  latestTracking: v.optional(v.object({
    status: v.string(), eventTime: v.string(), source: v.string(),
  })),
  hasConflict: v.optional(v.boolean()), actionKey: v.optional(v.string()),
  blocked: v.optional(v.boolean()),
});
const activeStatuses = new Set(["queued", "running", "waiting"]);
const maximumLeaseMs = 5 * 60 * 1000;
const maximumStoredTextLength = 4_000;
const proposalTools = new Set<AgentToolName>([
  "select_only_order",
  "prepare_customer_update",
  "prepare_identity_request",
  "prepare_courier_request",
]);

const runRound = makeFunctionReference<"action", { runId: string }, void>(
  "agent/runtime:runRound",
);

function boundedText(value: string, label: string) {
  const result = value.trim();
  if (result.length === 0) throw new Error(`${label} cannot be empty`);
  if (result.length > maximumStoredTextLength) {
    throw new Error(`${label} exceeds ${maximumStoredTextLength} characters`);
  }
  return result;
}

function boundedContextText(value: string, maximum: number, fallback: string) {
  const result = redactSensitiveText(value).slice(0, maximum);
  return result || fallback;
}

export const getRoundState = internalQuery({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args): Promise<AgentRoundState | null> => {
    const run = await ctx.db.get(args.runId);
    if (!run?.caseId) return null;
    const item = await ctx.db.get(run.caseId);
    if (!item) return null;
    const source = await ctx.db.get(item.sourceMessageId);
    if (!source) return null;
    const orders = (
      await Promise.all(
        (item.candidateOrderIds ?? (item.orderId ? [item.orderId] : [])).map(
          (orderId) => ctx.db.get(orderId),
        ),
      )
    ).filter((order) => order !== null);
    const order = item.orderId ? await ctx.db.get(item.orderId) : null;
    const scans = order
      ? await ctx.db
          .query("trackingScans")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect()
      : [];
    const latestScan = scans
      .filter((scan) => !order?.trackingNumber || scan.trackingNumber === order.trackingNumber)
      .sort((left, right) => right.eventTime.localeCompare(left.eventTime))[0];
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_case", (q) => q.eq("caseId", item._id))
      .collect();
    const priorSupportMessages = messages
      .filter((message) => message._id !== item.sourceMessageId && message.party === "support")
      .sort((left, right) => right.sentAt - left.sentAt)
      .slice(0, 8)
      .reverse()
      .map((message) => ({
        subject: boundedContextText(message.subject, 300, "(no subject)"),
        body: boundedContextText(message.text, 2_000, "(empty message)"),
      }));
    const founderReplyExamples = (
      await ctx.db.query("replyExamples").order("desc").take(5)
    )
      .reverse()
      .map((example) => ({
        customerMessage: boundedContextText(
          example.customerText,
          2_000,
          "(empty customer message)",
        ),
        founderReply: boundedContextText(
          example.replyText,
          2_000,
          "(empty founder reply)",
        ),
      }));
    const activePolicy = await ctx.db
      .query("agentPolicies")
      .withIndex("by_active", (q) => q.eq("active", true))
      .unique();
    const proof = activePolicy?.proofId ? await ctx.db.get(activePolicy.proofId) : null;
    const toolResults = await ctx.db
      .query("agentToolResults")
      .withIndex("by_run_call", (q) => q.eq("runId", args.runId))
      .collect();
    const completedProposalCalls = toolResults
      .filter((result) => proposalTools.has(result.name))
      .map((result) => ({ callId: result.callId, name: result.name }));
    const pendingCalls: AgentToolCall[] = run.pendingCalls.map((call) => ({
      callId: call.callId,
      name: call.name,
      arguments: validateAgentToolArguments(call.name, call.arguments),
    }));
    const pendingToolOutputs = run.pendingToolOutputs.length
      ? assertAgentSafeToolOutputs(run.pendingToolOutputs)
      : [];
    const context = assertAgentModelContext({
      caseStatus: item.status,
      subject: boundedContextText(source.subject, 300, "(no subject)"),
      body: boundedContextText(source.text, 8_000, "(empty message)"),
      priorSupportMessages,
      founderReplyExamples,
      identityMatched: Boolean(item.customerId),
      orderResolved: Boolean(order),
      orderCount: orders.length,
      ...(order
        ? {
            orderName: boundedContextText(order.name, 300, "Order"),
            lineItems: order.lineItems
              .slice(0, 20)
              .map((line) => boundedContextText(line, 300, "Item")),
            fulfillmentStatus: boundedContextText(
              order.fulfillmentStatus,
              120,
              "unknown",
            ),
            ...(order.trackingNumber
              ? { trackingNumber: boundedContextText(order.trackingNumber, 300, "unknown") }
              : {}),
            snapshotAt: order.snapshotAt,
          }
        : {}),
      ...(latestScan
        ? {
            latestTracking: {
              status: boundedContextText(latestScan.status, 120, "unknown"),
              eventTime: boundedContextText(latestScan.eventTime, 120, "unknown"),
              source: boundedContextText(latestScan.source, 120, "stored tracking"),
            },
          }
        : {}),
      hasConflict: scans.some(
        (scan) => order?.trackingNumber && scan.trackingNumber !== order.trackingNumber,
      ),
      workspacePolicy: {
        mode: activePolicy?.mode ?? "approval",
        proofComplete: proof?.status === "completed",
      },
    });
    return {
      runId: run._id,
      caseId: run.caseId,
      status: run.status,
      round: run.round,
      leaseVersion: run.leaseVersion,
      ...(run.previousResponseId ? { previousResponseId: run.previousResponseId } : {}),
      pendingCalls,
      pendingToolOutputs,
      completedProposalCalls,
      context,
    };
  },
});

export const start = internalMutation({
  args: {
    caseId: v.optional(v.id("cases")),
    proofId: v.optional(v.id("onboardingProofs")),
    trigger,
  },
  handler: async (ctx, args) => {
    if (Boolean(args.caseId) === Boolean(args.proofId)) {
      throw new Error("An agent run requires exactly one case or proof");
    }
    const candidates = args.caseId
      ? await ctx.db.query("agentRuns").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect()
      : await ctx.db.query("agentRuns").withIndex("by_proof", (q) => q.eq("proofId", args.proofId)).collect();
    const existing = candidates.find(
      (run) => run.trigger === args.trigger && activeStatuses.has(run.status),
    );
    if (existing) {
      const now = Date.now();
      if (
        existing.status === "running" &&
        (existing.leaseExpiresAt === undefined || existing.leaseExpiresAt <= now)
      ) {
        await ctx.db.patch(existing._id, {
          status: "queued", leaseExpiresAt: undefined, nextRunAt: now, updatedAt: now,
        });
      }
      return existing._id;
    }
    const now = Date.now();
    return await ctx.db.insert("agentRuns", {
      caseId: args.caseId,
      proofId: args.proofId,
      trigger: args.trigger,
      status: "queued",
      round: 0,
      attempt: 0,
      leaseVersion: 0,
      pendingCalls: [],
      pendingToolOutputs: [],
      inputTokens: 0,
      outputTokens: 0,
      startedAt: now,
      updatedAt: now,
    });
  },
});

export const claim = internalMutation({
  args: { runId: v.id("agentRuns"), leaseMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Agent run not found");
    const now = Date.now();
    if (
      run.status === "completed" || run.status === "failed" || run.status === "escalated" ||
      (run.nextRunAt !== undefined && run.nextRunAt > now) ||
      (run.status === "running" && run.leaseExpiresAt !== undefined && run.leaseExpiresAt > now)
    ) return null;

    const requestedLease = args.leaseMs ?? 60_000;
    const leaseMs = Math.max(1_000, Math.min(requestedLease, maximumLeaseMs));
    const leaseVersion = run.leaseVersion + 1;
    if (run.status === "running") {
      const steps = await ctx.db
        .query("agentSteps")
        .withIndex("by_run", (q) => q.eq("runId", args.runId))
        .collect();
      for (const step of steps) {
        if (step.status === "running") {
          await ctx.db.patch(step._id, {
            status: "failed",
            error: "Agent worker lease expired before the step completed",
            completedAt: now,
          });
        }
      }
    }
    await ctx.db.patch(args.runId, {
      status: "running",
      attempt: run.attempt + 1,
      leaseVersion,
      leaseExpiresAt: now + leaseMs,
      nextRunAt: undefined,
      updatedAt: now,
    });
    return leaseVersion;
  },
});

export const recordModelResponse = internalMutation({
  args: {
    runId: v.id("agentRuns"), expectedLeaseVersion: v.number(),
    responseId: v.string(), inputTokens: v.number(), outputTokens: v.number(),
    calls: v.array(v.object({ callId: v.string(), name: agentToolName, arguments: v.any() })),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Agent run not found");
    const now = Date.now();
    assertLeaseWriteAllowed(run, args.expectedLeaseVersion, now);
    if (args.inputTokens < 0 || args.outputTokens < 0) {
      throw new Error("Token counts cannot be negative");
    }
    const callIds = args.calls.map((call) => call.callId);
    if (new Set(callIds).size !== callIds.length) {
      throw new Error("Model response contains duplicate call IDs");
    }
    const validatedCalls = args.calls.map((call) => ({
      ...call,
      arguments: validateAgentToolArguments(call.name, call.arguments),
    }));
    const hasCalls = args.calls.length > 0;
    await ctx.db.patch(args.runId, {
      status: hasCalls ? "queued" : "running",
      round: run.round + 1,
      previousResponseId: args.responseId,
      pendingCalls: validatedCalls.map((call) => ({
        ...call,
        arguments: toAgentAuditInput({ kind: "tool", name: call.name, value: call.arguments }),
      })),
      pendingToolOutputs: [],
      inputTokens: run.inputTokens + args.inputTokens,
      outputTokens: run.outputTokens + args.outputTokens,
      leaseExpiresAt: hasCalls ? undefined : run.leaseExpiresAt,
      nextRunAt: hasCalls ? now : undefined,
      updatedAt: now,
    });
    if (hasCalls) await ctx.scheduler.runAfter(0, runRound, { runId: args.runId });
  },
});

export const recordToolBatch = internalMutation({
  args: {
    runId: v.id("agentRuns"), expectedLeaseVersion: v.number(),
    outputs: v.array(v.object({
      callId: v.string(), name: agentToolName, result: safeAgentToolResult,
    })),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Agent run not found");
    const now = Date.now();
    assertLeaseWriteAllowed(run, args.expectedLeaseVersion, now);
    const validatedOutputs = assertAgentSafeToolOutputs(args.outputs);
    const persistedOutputs = persistExactToolBatch(run.pendingCalls, validatedOutputs);
    await ctx.db.patch(args.runId, {
      status: "queued",
      pendingCalls: [],
      pendingToolOutputs: persistedOutputs,
      leaseExpiresAt: undefined,
      nextRunAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, runRound, { runId: args.runId });
  },
});

export const startStep = internalMutation({
  args: {
    runId: v.id("agentRuns"), expectedLeaseVersion: v.number(),
    kind: stepKind, name: v.string(), input: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Agent run not found");
    const now = Date.now();
    assertLeaseWriteAllowed(run, args.expectedLeaseVersion, now);
    const existingSteps = await ctx.db
      .query("agentSteps").withIndex("by_run", (q) => q.eq("runId", args.runId)).collect();
    const stepId = await ctx.db.insert("agentSteps", {
      runId: args.runId,
      sequence: existingSteps.length + 1,
      kind: args.kind,
      name: args.name,
      status: "running",
      input: args.input === undefined
        ? undefined
        : toAgentAuditInput({
            kind: args.kind,
            name: args.name,
            value: assertAgentStepInput({ kind: args.kind, name: args.name, value: args.input }),
          }),
      startedAt: now,
    });
    await ctx.db.patch(args.runId, { updatedAt: now });
    return stepId;
  },
});

export const finishStep = internalMutation({
  args: {
    stepId: v.id("agentSteps"), expectedLeaseVersion: v.number(),
    status: v.optional(v.union(v.literal("completed"), v.literal("blocked"), v.literal("failed"))),
    output: v.optional(v.any()), error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const step = await ctx.db.get(args.stepId);
    if (!step) throw new Error("Agent step not found");
    if (step.status !== "running") throw new Error("Agent step is already terminal");
    const run = await ctx.db.get(step.runId);
    if (!run) throw new Error("Agent run not found");
    const now = Date.now();
    assertLeaseWriteAllowed(run, args.expectedLeaseVersion, now);
    const status = args.status ?? "completed";
    const error = args.error === undefined ? undefined : boundedText(args.error, "Step error");
    if (status === "failed" && error === undefined) {
      throw new Error("A failed agent step requires an error");
    }
    if (status !== "failed" && error !== undefined) {
      throw new Error("Only a failed agent step may store an error");
    }
    await ctx.db.patch(args.stepId, {
      status,
      output: args.output === undefined
        ? undefined
        : assertAgentStepOutput({ kind: step.kind, name: step.name, value: args.output }),
      error,
      completedAt: now,
    });
    await ctx.db.patch(step.runId, { updatedAt: now });
  },
});

export const complete = internalMutation({
  args: {
    runId: v.id("agentRuns"), expectedLeaseVersion: v.number(),
    finalText: v.string(), recommendation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Agent run not found");
    const now = Date.now();
    assertLeaseWriteAllowed(run, args.expectedLeaseVersion, now);
    await ctx.db.patch(args.runId, {
      status: "completed",
      pendingCalls: [],
      pendingToolOutputs: [],
      leaseExpiresAt: undefined,
      nextRunAt: undefined,
      finalText: boundedText(args.finalText, "Final text"),
      recommendation: args.recommendation === undefined
        ? undefined
        : boundedText(args.recommendation, "Recommendation"),
      completedAt: now,
      updatedAt: now,
    });
  },
});

export const fail = internalMutation({
  args: {
    runId: v.id("agentRuns"), expectedLeaseVersion: v.number(), error: v.string(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Agent run not found");
    const now = Date.now();
    assertLeaseWriteAllowed(run, args.expectedLeaseVersion, now);
    const error = boundedText(args.error, "Run error");
    const steps = await ctx.db
      .query("agentSteps").withIndex("by_run", (q) => q.eq("runId", args.runId)).collect();
    for (const step of steps) {
      if (step.status === "running") {
        await ctx.db.patch(step._id, { status: "failed", error, completedAt: now });
      }
    }
    await ctx.db.patch(args.runId, {
      status: "failed",
      error,
      leaseExpiresAt: undefined,
      nextRunAt: undefined,
      updatedAt: now,
      completedAt: now,
    });
  },
});

export const escalate = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    expectedLeaseVersion: v.number(),
    reason: v.string(),
    recommendation: v.string(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Agent run not found");
    const now = Date.now();
    assertLeaseWriteAllowed(run, args.expectedLeaseVersion, now);
    const reason = boundedText(args.reason, "Escalation reason");
    const recommendation = boundedText(args.recommendation, "Escalation recommendation");
    const steps = await ctx.db
      .query("agentSteps")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();
    for (const step of steps) {
      if (step.status === "running") {
        await ctx.db.patch(step._id, {
          status: "blocked",
          completedAt: now,
        });
      }
    }
    await ctx.db.patch(args.runId, {
      status: "escalated",
      pendingCalls: [],
      pendingToolOutputs: [],
      leaseExpiresAt: undefined,
      nextRunAt: undefined,
      error: reason,
      recommendation,
      completedAt: now,
      updatedAt: now,
    });
  },
});

export const recoverExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const running = await ctx.db
      .query("agentRuns")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();
    const expired = running.filter(
      (run) => run.leaseExpiresAt === undefined || run.leaseExpiresAt <= now,
    );
    for (const run of expired) {
      const steps = await ctx.db
        .query("agentSteps")
        .withIndex("by_run", (q) => q.eq("runId", run._id))
        .collect();
      for (const step of steps) {
        if (step.status === "running") {
          await ctx.db.patch(step._id, {
            status: "failed",
            error: "Agent worker lease expired before the step completed",
            completedAt: now,
          });
        }
      }
      await ctx.db.patch(run._id, {
        status: "queued",
        leaseExpiresAt: undefined,
        nextRunAt: now,
        updatedAt: now,
      });
      await ctx.scheduler.runAfter(0, runRound, { runId: run._id });
    }
    return expired.length;
  },
});

export const retryFailed = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    const item = await ctx.db.get(args.caseId);
    if (!item) throw new Error("Case not found");
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    const latest = runs.sort((left, right) => right.startedAt - left.startedAt)[0];
    if (!latest || latest.status !== "failed") {
      throw new Error("Only the latest failed agent run can be retried");
    }
    return scheduleCaseAgentRun(ctx, { caseId: args.caseId, trigger: "retry" });
  },
});
