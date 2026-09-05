"use client";

import { makeFunctionReference } from "convex/server";
import { useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import styles from "./page.module.css";

type Trace = { run: { status: string; round: number; startedAt: number; updatedAt: number; inputTokens: number; outputTokens: number } | null; activities: Array<{ at: number; label: string; detail: string }> } | null;
const ref = makeFunctionReference<"query", { caseId: Id<"cases"> }, Trace>("observability:getCaseObservability");

export default function ObservabilityDisclosure({ caseId }: { caseId: Id<"cases"> }) {
  const trace = useQuery(ref, { caseId });
  return <details className={styles.observability}><summary>How WISMO handled this{trace?.run ? ` · ${trace.run.status}` : ""}</summary>{trace === undefined ? <p>Loading activity…</p> : trace === null ? <p>Trace unavailable.</p> : <><p>{trace.run ? `Round ${trace.run.round} · ${trace.run.inputTokens + trace.run.outputTokens} model tokens` : "No agent run recorded."}</p><ol>{trace.activities.map((activity, index) => <li key={`${activity.at}-${index}`}><time>{new Date(activity.at).toLocaleString()}</time><strong>{activity.label}</strong><span>{activity.detail}</span></li>)}</ol></>}</details>;
}
