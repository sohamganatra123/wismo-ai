import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function recordCaseEvent(
  ctx: MutationCtx,
  input: {
    caseId: Id<"cases">;
    type: string;
    summary: string;
    contextSource?: string;
    toolName?: string;
    toolInput?: unknown;
    toolResult?: unknown;
    error?: string;
    actorUserId?: Id<"users">;
  },
) {
  await ctx.db.insert("events", {
    ...input,
    createdAt: Date.now(),
  });
}
