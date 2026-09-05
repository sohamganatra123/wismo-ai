"use client";

import { makeFunctionReference } from "convex/server";
import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import styles from "../page.module.css";

type Item = { id: string; subject: string; from: string; resolvedAt: number; outcome: string; messageCount: number; replyPreview: string | null };
const ref = makeFunctionReference<"query", Record<string, never>, Item[]>("inboxViews:history");

export default function HistoryPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const history = useQuery(ref, isAuthenticated ? {} : "skip");
  if (isLoading) return <main className={styles.workspace}><p>Checking access…</p></main>;
  if (!isAuthenticated) return <main className={styles.workspace}><h1>History</h1><p>Sign in to see resolved conversations.</p><Link href="/login">Sign in</Link></main>;
  return <main className={styles.workspace}><header className={styles.header}><div><p className={styles.eyebrow}>Operations inbox</p><h1>History</h1></div><Link href="/inbox">← Inbox</Link></header><section className={styles.liveCases}><p className={styles.liveDescription}>Resolved conversations and the replies that were delivered.</p>{history === undefined ? <p>Loading history…</p> : history.length === 0 ? <p>No resolved conversations yet.</p> : <div className={styles.receivedList}>{history.map((item) => <article className={styles.caseState} data-tone="done" key={item.id}><small>{item.outcome} · {new Date(item.resolvedAt).toLocaleString()}</small><strong>{item.subject}</strong><p>{item.from} · {item.messageCount} messages</p>{item.replyPreview ? <p>“{item.replyPreview}”</p> : null}<Link href={`/inbox?case=${item.id}`}>Open conversation →</Link></article>)}</div>}</section></main>;
}
