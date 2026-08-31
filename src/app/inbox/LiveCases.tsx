"use client";

import { makeFunctionReference } from "convex/server";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import styles from "./page.module.css";

type ReceivedCase = {
  id: string;
  createdAt: number;
  providerId: string;
  threadId: string;
  from: string;
  subject: string;
  text: string;
};
const listRef = makeFunctionReference<
  "query",
  Record<string, never>,
  ReceivedCase[]
>("gmailData:listReceivedCases");
const pollRef = makeFunctionReference<
  "action",
  Record<string, never>,
  {
    created: number;
    clarified: number;
    ignored: number;
    checked: number;
    status: "ok" | "not_connected" | "cursor_reset";
  }
>("gmailPolling:pollNow");

export default function LiveCases() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const rows = useQuery(listRef, isAuthenticated ? {} : "skip");
  const poll = useAction(pollRef);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState("");
  async function pollNow() {
    setWorking(true);
    setFeedback("");
    try {
      const result = await poll({});
      setFeedback(
        result.status === "not_connected"
          ? "Connect Gmail in founder setup first."
          : result.status === "cursor_reset"
            ? "Gmail history was reset. Send a new test email, then poll again."
            : `${result.created} new case${result.created === 1 ? "" : "s"}, ${result.clarified} clarification repl${result.clarified === 1 ? "y" : "ies"}, and ${result.ignored} unrelated message${result.ignored === 1 ? "" : "s"} ignored from ${result.checked} checked message${result.checked === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Gmail poll failed");
    } finally {
      setWorking(false);
    }
  }
  if (isLoading)
    return (
      <section className={styles.liveCases}>
        <p>Checking the test inbox connection…</p>
      </section>
    );
  if (!isAuthenticated)
    return (
      <section className={styles.liveCases}>
        <div>
          <p className={styles.eyebrow}>Live intake · Gmail</p>
          <h2>Sign in to review polled cases.</h2>
          <p className={styles.liveDescription}>
            The sample queue stays visible below. Sign in to see messages
            received from your connected test inbox.
          </p>
        </div>
        <Link className={styles.liveAction} href="/connect">
          Sign in to WISMO <span>→</span>
        </Link>
      </section>
    );
  return (
    <section className={styles.liveCases} aria-labelledby="live-cases-title">
      <header>
        <div>
          <p className={styles.eyebrow}>Live intake · Gmail · every minute</p>
          <h2 id="live-cases-title">New from the test inbox</h2>
          <p className={styles.liveDescription}>
            Original messages waiting for the next WISMO processing step.
          </p>
        </div>
        <button onClick={pollNow} disabled={working}>
          {working ? "Polling Gmail…" : "Poll now"}
        </button>
      </header>
      {feedback ? (
        <p className={styles.pollFeedback} aria-live="polite">
          {feedback}
        </p>
      ) : null}
      <div className={styles.receivedList}>
        {rows === undefined ? (
          <p>Loading received cases…</p>
        ) : rows.length === 0 ? (
          <p>
            No polled email yet. Send a new message to the connected inbox, then
            poll.
          </p>
        ) : (
          rows.map((item) => (
            <article key={item.id}>
              <header>
                <div>
                  <small>From</small>
                  <strong>{item.from}</strong>
                </div>
                <time>{new Date(item.createdAt).toLocaleString()}</time>
              </header>
              <h3>{item.subject}</h3>
              <p>{item.text || "(empty message)"}</p>
              <dl>
                <div>
                  <dt>Gmail conversation ID</dt>
                  <dd>{item.threadId}</dd>
                </div>
                <div>
                  <dt>Gmail message ID</dt>
                  <dd>{item.providerId}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
