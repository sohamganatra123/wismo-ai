import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { estimateAgentCostUsd } from "./domain/agentCost";

export type ConversationUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number | null;
};

export function aggregateConversationUsage(
  runs: Array<{ inputTokens: number; outputTokens: number }>,
  model: string,
): ConversationUsage {
  const inputTokens = runs.reduce((total, run) => total + run.inputTokens, 0);
  const outputTokens = runs.reduce((total, run) => total + run.outputTokens, 0);
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCostUsd: runs.length === 0 || inputTokens + outputTokens === 0
      ? null
      : estimateAgentCostUsd({ model, inputTokens, outputTokens }),
  };
}

export function hasAgentResponse(
  messages: Array<{ party: string; kind?: string }>,
) {
  return messages.some(
    (message) =>
      message.party === "support" &&
      (message.kind === "agent_reply" || message.kind === "agent_clarification"),
  );
}

export const getCaseObservability = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!profile) return null;
    const item = await ctx.db.get(args.caseId);
    if (!item) return null;
    const sourceMessage = await ctx.db.get(item.sourceMessageId);
    const [runs, events, approvals, messages, threadMessages] = await Promise.all([
      ctx.db.query("agentRuns").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect(),
      ctx.db.query("events").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect(),
      ctx.db.query("approvals").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect(),
      ctx.db.query("messages").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect(),
      sourceMessage
        ? ctx.db.query("messages").withIndex("by_thread", (q) => q.eq("threadId", sourceMessage.threadId)).collect()
        : Promise.resolve([]),
    ]);
    const steps = (await Promise.all(runs.map((run) => ctx.db.query("agentSteps").withIndex("by_run", (q) => q.eq("runId", run._id)).collect()))).flat();
    const activities = [
      ...steps.map((step) => ({ at: step.startedAt, label: step.name, detail: `${step.kind} step · ${step.status}` })),
      ...events.map((event) => ({ at: event.createdAt, label: event.type.replaceAll("_", " "), detail: event.summary })),
      ...approvals.map((approval) => ({ at: approval.proposedAt, label: "approval", detail: `${approval.kind.replaceAll("_", " ")} · ${approval.status}` })),
    ].sort((a, b) => b.at - a.at).slice(0, 100);
    const latest = runs.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
    const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";
    const usage = aggregateConversationUsage(runs, model);
    // The thread is the source of truth for what the founder sees in Gmail.
    // Keep the case-indexed messages for activity data, but also recognize
    // replies that were stored before every message was linked to the case.
    const agentResponded = hasAgentResponse(threadMessages.length > 0 ? threadMessages : messages);
    return {
      run: latest
        ? { status: latest.status, round: latest.round, startedAt: latest.startedAt, updatedAt: latest.updatedAt }
        : agentResponded
          ? { status: "responded", round: 0, startedAt: messages.find((message) => message.kind === "agent_reply" || message.kind === "agent_clarification")?.sentAt ?? item.updatedAt, updatedAt: item.updatedAt }
          : null,
      usage,
      activities,
    };
  },
});
