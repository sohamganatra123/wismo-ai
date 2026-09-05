import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

export const getCaseObservability = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!profile) return null;
    const item = await ctx.db.get(args.caseId);
    if (!item) return null;
    const runs = await ctx.db.query("agentRuns").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect();
    const steps = (await Promise.all(runs.map((run) => ctx.db.query("agentSteps").withIndex("by_run", (q) => q.eq("runId", run._id)).collect()))).flat();
    const events = await ctx.db.query("events").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect();
    const approvals = await ctx.db.query("approvals").withIndex("by_case", (q) => q.eq("caseId", args.caseId)).collect();
    const activities = [
      ...steps.map((step) => ({ at: step.startedAt, label: step.name, detail: `${step.kind} step · ${step.status}` })),
      ...events.map((event) => ({ at: event.createdAt, label: event.type.replaceAll("_", " "), detail: event.summary })),
      ...approvals.map((approval) => ({ at: approval.proposedAt, label: "approval", detail: `${approval.kind.replaceAll("_", " ")} · ${approval.status}` })),
    ].sort((a, b) => b.at - a.at).slice(0, 100);
    const latest = runs.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
    return {
      run: latest ? { status: latest.status, round: latest.round, startedAt: latest.startedAt, updatedAt: latest.updatedAt, inputTokens: latest.inputTokens, outputTokens: latest.outputTokens } : null,
      activities,
    };
  },
});
