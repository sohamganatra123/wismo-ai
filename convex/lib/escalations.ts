import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { recordCaseEvent } from "./caseEvents";

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export function assignEscalationDeadline(now: number) {
  return {
    responseDeadlineAt: now + HOUR_MS,
    escalationOwnerReminderAt: now + HOUR_MS,
    finalReminderAt: now + 80 * MINUTE_MS,
  };
}

export async function escalateCase(
  ctx: MutationCtx,
  input: {
    caseId: Id<"cases">;
    escalationReason: string;
    recommendation: string;
    actorUserId?: Id<"users">;
    guidance?: string;
    contextSource?: string;
    toolName?: string;
    toolResult?: unknown;
    error?: string;
  },
) {
  const now = Date.now();
  await ctx.db.patch(input.caseId, {
    status: "human_attention",
    escalationReason: input.escalationReason,
    recommendation: input.recommendation,
    escalatedAt: now,
    ...assignEscalationDeadline(now),
    ...(input.guidance ? { guidance: input.guidance } : {}),
    updatedAt: now,
  });
  await recordCaseEvent(ctx, {
    caseId: input.caseId,
    type: "case_escalated",
    summary: input.escalationReason,
    contextSource: input.contextSource ?? "system",
    toolName: input.toolName,
    toolResult: input.toolResult,
    error: input.error,
    actorUserId: input.actorUserId,
  });
}
