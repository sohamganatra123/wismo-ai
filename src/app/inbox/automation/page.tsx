"use client";

import { makeFunctionReference } from "convex/server";
import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import styles from "../page.module.css";

type Run = { id: string; caseId: string | null; status: string; trigger: string; round: number; startedAt: number; updatedAt: number; estimatedCostUsd: number | null; currentStep: { name: string; kind: string; status: string } | null };
const ref = makeFunctionReference<"query", Record<string, never>, Run[]>("inboxViews:activeAutomation");

export default function ActiveAutomationPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const runs = useQuery(ref, isAuthenticated ? {} : "skip");
  if (isLoading) return <main className={styles.workspace}><p>Checking access…</p></main>;
  if (!isAuthenticated) return <main className={styles.workspace}><h1>Active automation</h1><p>Sign in to see running work.</p><Link href="/login">Sign in</Link></main>;
  return <main className={styles.workspace}><header className={styles.header}><div><p className={styles.eyebrow}>Operations inbox</p><h1>Active automation</h1></div><Link href="/inbox">← Inbox</Link></header><section className={styles.liveCases}><p className={styles.liveDescription}>Work WISMO is currently processing or waiting to continue.</p>{runs === undefined ? <p>Loading automation…</p> : runs.length === 0 ? <p>No automation is running right now.</p> : <div className={styles.receivedList}>{runs.map((run) => <article className={styles.caseState} data-tone="neutral" key={run.id}><small>{run.status} · {run.trigger.replaceAll("_", " ")}</small><strong>{run.currentStep?.name ?? "Preparing next step"}</strong><p>Round {run.round} · Updated {new Date(run.updatedAt).toLocaleString()}</p><p>Estimated cost {run.estimatedCostUsd === null ? "unavailable" : `$${run.estimatedCostUsd.toFixed(6)}`}</p>{run.caseId ? <Link href={`/inbox?case=${run.caseId}`}>Open conversation →</Link> : null}</article>)}</div>}</section></main>;
}
