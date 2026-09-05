import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { estimateAgentCostUsd } from "./domain/agentCost";

const activeStatuses = ["queued", "running", "waiting"] as const;

export const activeAutomation = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique())) return [];
    const runs = (await Promise.all(activeStatuses.map((status) =>
      ctx.db.query("agentRuns").withIndex("by_status", (q) => q.eq("status", status)).order("desc").take(50),
    ))).flat().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 50);
    return Promise.all(runs.map(async (run) => {
      const steps = await ctx.db.query("agentSteps").withIndex("by_run", (q) => q.eq("runId", run._id)).collect();
      const current = steps.sort((a, b) => b.startedAt - a.startedAt)[0];
      return {
        id: run._id,
        caseId: run.caseId ?? null,
        status: run.status,
        trigger: run.trigger,
        round: run.round,
        startedAt: run.startedAt,
        updatedAt: run.updatedAt,
        estimatedCostUsd: estimateAgentCostUsd({ model: process.env.OPENAI_MODEL ?? "gpt-5-mini", inputTokens: run.inputTokens, outputTokens: run.outputTokens }),
        currentStep: current ? { name: current.name, kind: current.kind, status: current.status } : null,
      };
    }));
  },
});

export const history = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique())) return [];
    const cases = await ctx.db.query("cases").withIndex("by_status", (q) => q.eq("status", "closed")).order("desc").take(50);
    return Promise.all(cases.map(async (item) => {
      const source = await ctx.db.get(item.sourceMessageId);
      const messages = source ? await ctx.db.query("messages").withIndex("by_thread", (q) => q.eq("threadId", source.threadId)).collect() : [];
      const outbound = messages.filter((message) => message.direction === "outbound" && message.deliveryStatus === "sent").sort((a, b) => b.sentAt - a.sentAt)[0];
      const founder = messages.some((message) => message.kind === "founder_reply" && message.deliveryStatus === "sent");
      return {
        id: item._id,
        subject: source?.subject ?? "Untitled conversation",
        from: source?.from ?? "Unknown sender",
        resolvedAt: item.resolvedAt ?? item.closedAt ?? item.updatedAt,
        outcome: founder ? "Founder replied" : outbound?.kind === "agent_clarification" ? "Clarification sent" : "Automatic reply sent",
        messageCount: messages.length,
        replyPreview: outbound?.text ? outbound.text.replace(/\s+/g, " ").trim().slice(0, 180) : null,
      };
    }));
  },
});
