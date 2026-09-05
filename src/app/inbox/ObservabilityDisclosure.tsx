"use client";

import { makeFunctionReference } from "convex/server";
import { useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import styles from "./page.module.css";
import { formatConversationUsage } from "./observabilityPresentation";

type ConversationUsage = { inputTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number | null };
type Trace = { run: { status: string; round: number; startedAt: number; updatedAt: number } | null; usage?: ConversationUsage; activities?: Array<{ at: number; label: string; detail: string }> } | null;
const ref = makeFunctionReference<"query", { caseId: Id<"cases"> }, Trace>("observability:getCaseObservability");
const emptyUsage: ConversationUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: null };

export default function ObservabilityDisclosure({ caseId }: { caseId: Id<"cases"> }) {
  const trace = useQuery(ref, { caseId });
  const usage = trace?.usage ?? emptyUsage;
  const activities = trace?.activities ?? [];
  const hasUsage = usage.totalTokens > 0;
  return <details className={styles.observability}><summary>How WISMO handled this{trace?.run ? ` · ${trace.run.status}` : ""}</summary>{trace === undefined ? <p>Loading activity…</p> : trace === null ? <p>Trace unavailable.</p> : <><p>{trace.run ? `${trace.run.status === "responded" ? "Agent response recorded" : `Round ${trace.run.round}`} · ${formatConversationUsage(usage)}` : hasUsage ? `Conversation usage · ${formatConversationUsage(usage)}` : "No agent activity recorded."}</p><ol>{activities.map((activity, index) => <li key={`${activity.at}-${index}`}><time>{new Date(activity.at).toLocaleString()}</time><strong>{activity.label}</strong><span>{activity.detail}</span></li>)}</ol></>}</details>;
}
