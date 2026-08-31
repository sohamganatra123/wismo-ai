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
  status: "received" | "investigating" | "identity_needed" | "order_needed";
  customer: { name: string; email: string } | null;
  orders: Array<{
    id: string;
    name: string;
    createdAt: string;
    lineItems: string[];
    fulfillmentStatus: string;
    trackingNumber?: string;
    trackingUrl?: string;
  }>;
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
            Original messages with saved Shopify identity and delivery evidence.
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
              <div className={styles.shopifyEvidence}>
                {item.customer ? (
                  <>
                    <header>
                      <div>
                        <small>Exact Shopify match</small>
                        <strong>{item.customer.name}</strong>
                        <span>{item.customer.email}</span>
                      </div>
                      <b>{item.orders.length} active</b>
                    </header>
                    {item.orders.length ? (
                      <div className={styles.orderEvidence}>
                        {item.orders.map((order) => (
                          <section key={order.id}>
                            <div>
                              <strong>{order.name}</strong>
                              <span>{order.lineItems.join(", ")}</span>
                            </div>
                            <div>
                              <small>Fulfillment</small>
                              <strong>
                                {order.fulfillmentStatus.replaceAll("_", " ")}
                              </strong>
                            </div>
                            <div>
                              <small>Tracking</small>
                              <strong>
                                {order.trackingNumber ?? "Not added"}
                              </strong>
                            </div>
                          </section>
                        ))}
                      </div>
                    ) : (
                      <p>No active Shopify orders found for this customer.</p>
                    )}
                  </>
                ) : item.status === "identity_needed" ? (
                  <p>
                    No exact Shopify customer match. No order data was shown.
                  </p>
                ) : (
                  <p>Shopify customer match pending.</p>
                )}
              </div>
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
