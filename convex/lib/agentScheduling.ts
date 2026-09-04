import { makeFunctionReference } from "convex/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export type CaseAgentTrigger = "inbound" | "courier_reply" | "retry";

const runRound = makeFunctionReference<
  "action",
  { runId: Id<"agentRuns"> },
  void
>("agent/runtime:runRound");

const activeStatuses = new Set(["queued", "running", "waiting"]);

/** Creates and schedules exactly one first round for a case run. */
export async function scheduleCaseAgentRun(
  ctx: MutationCtx,
  input: { caseId: Id<"cases">; trigger: CaseAgentTrigger },
) {
  const runs = await ctx.db
    .query("agentRuns")
    .withIndex("by_case", (q) => q.eq("caseId", input.caseId))
    .collect();
  const existing = runs.find(
    (run) => run.trigger === input.trigger && activeStatuses.has(run.status),
  );
  const now = Date.now();
  if (existing) {
    if (
      existing.status === "running" &&
      (existing.leaseExpiresAt === undefined || existing.leaseExpiresAt <= now)
    ) {
      await ctx.db.patch(existing._id, {
        status: "queued",
        leaseExpiresAt: undefined,
        nextRunAt: now,
        updatedAt: now,
      });
      await ctx.scheduler.runAfter(0, runRound, { runId: existing._id });
    } else if (existing.status === "queued" || existing.status === "waiting") {
      await ctx.scheduler.runAfter(0, runRound, { runId: existing._id });
    }
    return existing._id;
  }

  const runId = await ctx.db.insert("agentRuns", {
    caseId: input.caseId,
    trigger: input.trigger,
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
  await ctx.scheduler.runAfter(0, runRound, { runId });
  return runId;
}
