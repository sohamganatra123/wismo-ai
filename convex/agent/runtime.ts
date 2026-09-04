import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { internalAction, type ActionCtx } from "../_generated/server";
import type {
  AgentRoundState,
  AgentSafeToolResult,
  AgentSafeToolOutput,
  AgentToolCall,
} from "./contracts";
import { createAgentResponse } from "./openai";

const maximumToolRounds = 8;
const mutatingProposalNames = new Set([
  "select_only_order",
  "prepare_customer_update",
  "prepare_identity_request",
  "prepare_courier_request",
]);

type RoundDecision =
  | { kind: "model" }
  | { kind: "tools"; calls: AgentToolCall[] }
  | { kind: "escalate"; reason: string; recommendation: string };

export async function executeToolCalls<TStep>(
  calls: AgentToolCall[],
  operations: {
    start(call: AgentToolCall): Promise<TStep>;
    dispatch(call: AgentToolCall): Promise<AgentSafeToolResult>;
    finish(step: TStep, result: AgentSafeToolResult): Promise<void>;
  },
) {
  const outputs: AgentSafeToolOutput[] = [];
  for (const call of calls) {
    const step = await operations.start(call);
    const result = await operations.dispatch(call);
    await operations.finish(step, result);
    outputs.push({ callId: call.callId, name: call.name, result });
  }
  return outputs;
}

export function decideRound(state: AgentRoundState): RoundDecision {
  if (state.pendingCalls.length > 0) {
    const proposals = state.pendingCalls.filter((call) =>
      mutatingProposalNames.has(call.name),
    );
    const repeated = proposals.find(
      (call, index) =>
        state.completedProposalCalls.some(
          (completed) => completed.name === call.name && completed.callId !== call.callId,
        ) ||
        proposals.findIndex((candidate) => candidate.name === call.name) !== index,
    );
    if (repeated) {
      return {
        kind: "escalate",
        reason: `Agent repeated the mutating proposal ${repeated.name}`,
        recommendation: "Review the case and its existing pending action before resuming.",
      };
    }
    return { kind: "tools", calls: state.pendingCalls };
  }
  if (state.round >= maximumToolRounds) {
    return {
      kind: "escalate",
      reason: "Agent exceeded the eight-round tool limit",
      recommendation: "Review the collected evidence and choose the next safe action.",
    };
  }
  return { kind: "model" };
}

const getRoundState = makeFunctionReference<
  "query",
  { runId: Id<"agentRuns"> },
  AgentRoundState | null
>("agentRuns:getRoundState");
const claim = makeFunctionReference<
  "mutation",
  { runId: Id<"agentRuns">; leaseMs?: number },
  number | null
>("agentRuns:claim");
const startStep = makeFunctionReference<
  "mutation",
  {
    runId: Id<"agentRuns">;
    expectedLeaseVersion: number;
    kind: "model" | "tool" | "policy";
    name: string;
    input?: unknown;
  },
  Id<"agentSteps">
>("agentRuns:startStep");
const finishStep = makeFunctionReference<
  "mutation",
  {
    stepId: Id<"agentSteps">;
    expectedLeaseVersion: number;
    status?: "completed" | "blocked" | "failed";
    output?: unknown;
    error?: string;
  },
  void
>("agentRuns:finishStep");
const recordModelResponse = makeFunctionReference<
  "mutation",
  {
    runId: Id<"agentRuns">;
    expectedLeaseVersion: number;
    responseId: string;
    inputTokens: number;
    outputTokens: number;
    calls: AgentToolCall[];
  },
  void
>("agentRuns:recordModelResponse");
const recordToolBatch = makeFunctionReference<
  "mutation",
  {
    runId: Id<"agentRuns">;
    expectedLeaseVersion: number;
    outputs: AgentSafeToolOutput[];
  },
  void
>("agentRuns:recordToolBatch");
const complete = makeFunctionReference<
  "mutation",
  {
    runId: Id<"agentRuns">;
    expectedLeaseVersion: number;
    finalText: string;
    recommendation?: string;
  },
  void
>("agentRuns:complete");
const escalate = makeFunctionReference<
  "mutation",
  {
    runId: Id<"agentRuns">;
    expectedLeaseVersion: number;
    reason: string;
    recommendation: string;
  },
  void
>("agentRuns:escalate");
const fail = makeFunctionReference<
  "mutation",
  { runId: Id<"agentRuns">; expectedLeaseVersion: number; error: string },
  void
>("agentRuns:fail");
const dispatchTool = makeFunctionReference<
  "mutation",
  {
    runId: Id<"agentRuns">;
    expectedLeaseVersion: number;
    call: AgentToolCall;
  },
  AgentSafeToolOutput["result"]
>("agent/tools:dispatchTool");
const escalateRunCase = makeFunctionReference<
  "mutation",
  {
    runId: Id<"agentRuns">;
    expectedLeaseVersion: number;
    reason: string;
    recommendation: string;
  },
  void
>("agent/tools:escalateRunCase");

function errorMessage(error: unknown) {
  return (error instanceof Error ? error.message : "Agent round failed").slice(0, 4_000);
}

async function escalateRound(
  ctx: ActionCtx,
  input: {
    runId: Id<"agentRuns">;
    leaseVersion: number;
    reason: string;
    recommendation: string;
  },
) {
  await ctx.runMutation(escalateRunCase, {
    runId: input.runId,
    expectedLeaseVersion: input.leaseVersion,
    reason: input.reason,
    recommendation: input.recommendation,
  });
  await ctx.runMutation(escalate, {
    runId: input.runId,
    expectedLeaseVersion: input.leaseVersion,
    reason: input.reason,
    recommendation: input.recommendation,
  });
}

export const runRound = internalAction({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args) => {
    const leaseVersion = await ctx.runMutation(claim, {
      runId: args.runId,
      leaseMs: 5 * 60 * 1_000,
    });
    if (leaseVersion === null) return;
    const state = await ctx.runQuery(getRoundState, { runId: args.runId });
    if (!state) {
      await ctx.runMutation(fail, {
        runId: args.runId,
        expectedLeaseVersion: leaseVersion,
        error: "Agent run has no valid case context",
      });
      return;
    }
    const decision = decideRound(state);

    try {
      if (decision.kind === "escalate") {
        await escalateRound(ctx, {
          runId: args.runId,
          leaseVersion,
          reason: decision.reason,
          recommendation: decision.recommendation,
        });
        return;
      }

      if (decision.kind === "tools") {
        const outputs = await executeToolCalls(decision.calls, {
          start: (call) => ctx.runMutation(startStep, {
            runId: args.runId, expectedLeaseVersion: leaseVersion,
            kind: "tool", name: call.name, input: call.arguments,
          }),
          dispatch: (call) => ctx.runMutation(dispatchTool, {
            runId: args.runId, expectedLeaseVersion: leaseVersion, call,
          }),
          finish: (stepId, result) => ctx.runMutation(finishStep, {
            stepId, expectedLeaseVersion: leaseVersion,
            status: result.blocked ? "blocked" : "completed", output: result,
          }),
        });
        const toolEscalation = outputs.find(
          (output) => output.name === "escalate_case" || output.result.status === "escalated",
        );
        if (toolEscalation) {
          await ctx.runMutation(escalate, {
            runId: args.runId,
            expectedLeaseVersion: leaseVersion,
            reason: toolEscalation.result.reason ?? "Agent escalated the case",
            recommendation:
              toolEscalation.result.recommendation ??
              "Review the collected evidence and choose the next safe action.",
          });
          return;
        }
        await ctx.runMutation(recordToolBatch, {
          runId: args.runId,
          expectedLeaseVersion: leaseVersion,
          outputs,
        });
        return;
      }

      const stepId = await ctx.runMutation(startStep, {
        runId: args.runId,
        expectedLeaseVersion: leaseVersion,
        kind: "model",
        name: "responses.create",
        input: state.context,
      });
      const response = state.previousResponseId && state.pendingToolOutputs.length
        ? await createAgentResponse({
            previousResponseId: state.previousResponseId,
            toolOutputs: state.pendingToolOutputs,
          })
        : await createAgentResponse({ context: state.context });
      await ctx.runMutation(finishStep, {
        stepId,
        expectedLeaseVersion: leaseVersion,
        output: {
          status: response.calls.length ? "tool_calls" : "final",
          responseId: response.responseId,
          callCount: response.calls.length,
          ...(response.finalText ? { finalText: response.finalText } : {}),
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
        },
      });
      await ctx.runMutation(recordModelResponse, {
        runId: args.runId,
        expectedLeaseVersion: leaseVersion,
        responseId: response.responseId,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        calls: response.calls,
      });
      if (response.calls.length === 0) {
        await ctx.runMutation(complete, {
          runId: args.runId,
          expectedLeaseVersion: leaseVersion,
          finalText: response.finalText,
          recommendation: response.finalText,
        });
      }
    } catch (error) {
      const reason = errorMessage(error);
      await ctx.runMutation(fail, {
        runId: args.runId,
        expectedLeaseVersion: leaseVersion,
        error: reason,
      });
    }
  },
});
