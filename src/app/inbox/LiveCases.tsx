"use client";

import { makeFunctionReference } from "convex/server";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
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
  status: "received" | "investigating" | "identity_needed" | "order_needed" | "awaiting_approval" | "awaiting_courier";
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
  identityRequest: {
    approvalId: string;
    status: "pending" | "approved" | "rejected" | "executing" | "completed" | "failed";
    to: string;
    subject: string;
    text: string;
  } | null;
  customerUpdate: {
    approvalId: string;
    status: "pending" | "approved" | "rejected" | "executing" | "completed" | "failed";
    proposedAt: number;
    to: string;
    subject: string;
    text: string;
  } | null;
  courierState: { contactName: string; waiting: boolean; replyText: string | null } | null;
  shopifyUpdate: {
    approvalId: string;
    status: "pending" | "approved" | "rejected" | "executing" | "completed" | "failed";
    proposedAt: number;
    note: string;
  } | null;
};
type InvestigationEvidence = {
  collectedAt: number;
  order: {
    id: string;
    name: string;
    createdAt: string;
    lineItems: string[];
    fulfillmentStatus: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  previousMessages: Array<{ id: string; subject: string; text: string; sentAt: number }>;
  latestTracking: {
    trackingNumber: string;
    status: string;
    eventTime: string;
    location?: string;
    description?: string;
  } | null;
};
function TrackingFact({ tracking }: { tracking: InvestigationEvidence["latestTracking"] }) {
  return (
    <div>
      <small>Latest tracking</small>
      <strong>{tracking?.status.replaceAll("_", " ") ?? "No valid match"}</strong>
      {tracking ? (
        <span>
          {new Date(tracking.eventTime).toLocaleString()}
          {tracking.location ? ` · ${tracking.location}` : ""}
        </span>
      ) : null}
    </div>
  );
}
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
const approveIdentityRef = makeFunctionReference<
  "action",
  { approvalId: string },
  { status: "sent" }
>("identityRequests:approveAndSend");
const investigateRef = makeFunctionReference<
  "mutation",
  { caseId: string },
  InvestigationEvidence
>("investigations:run");
const approveCustomerUpdateRef = makeFunctionReference<
  "action",
  { approvalId: string },
  { status: "sent" }
>("customerUpdates:approveAndSend");
const prepareCourierRef = makeFunctionReference<"mutation", { caseId: string }, { status: "waiting"; threadId: string; contactName: string }>("courierReplies:prepareWaitingCase");
const receiveCourierRef = makeFunctionReference<"mutation", { caseId: string; status: string; eventTime: string; location?: string }, { status: "proposed" }>("courierReplies:receiveSimulated");
const approveShopifyRef = makeFunctionReference<"action", { approvalId: string }, { status: "applied" }>("shopifyNotes:approveAndApply");

export default function LiveCases() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const rows = useQuery(listRef, isAuthenticated ? {} : "skip");
  const poll = useAction(pollRef);
  const approveIdentity = useAction(approveIdentityRef);
  const investigate = useMutation(investigateRef);
  const approveCustomerUpdate = useAction(approveCustomerUpdateRef);
  const prepareCourier = useMutation(prepareCourierRef);
  const receiveCourier = useMutation(receiveCourierRef);
  const approveShopify = useAction(approveShopifyRef);
  const [working, setWorking] = useState(false);
  const [sendingApproval, setSendingApproval] = useState<string | null>(null);
  const [sendingUpdate, setSendingUpdate] = useState<string | null>(null);
  const [courierWork, setCourierWork] = useState<string | null>(null);
  const [shopifyWork, setShopifyWork] = useState<string | null>(null);
  const [investigatingCase, setInvestigatingCase] = useState<string | null>(null);
  const [investigations, setInvestigations] = useState<Record<string, InvestigationEvidence>>({});
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
  async function sendIdentityRequest(approvalId: string) {
    setSendingApproval(approvalId);
    setFeedback("");
    try {
      await approveIdentity({ approvalId });
      setFeedback("Approved identity request sent once through Gmail.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Identity request failed");
    } finally {
      setSendingApproval(null);
    }
  }
  async function runInvestigation(caseId: string) {
    setInvestigatingCase(caseId);
    setFeedback("");
    try {
      const evidence = await investigate({ caseId });
      setInvestigations((current) => ({ ...current, [caseId]: evidence }));
      setFeedback("Investigation collected the case's safe Gmail, Shopify, fulfillment, and tracking evidence.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Investigation failed");
    } finally {
      setInvestigatingCase(null);
    }
  }
  async function sendCustomerUpdate(approvalId: string) {
    setSendingUpdate(approvalId);
    setFeedback("");
    try {
      await approveCustomerUpdate({ approvalId });
      setFeedback("Approved tracking update sent once in the original Gmail conversation.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Customer update failed");
    } finally {
      setSendingUpdate(null);
    }
  }
  async function waitForCourier(caseId: string) {
    setCourierWork(caseId);
    setFeedback("");
    try {
      const result = await prepareCourier({ caseId });
      setFeedback(`Waiting for ${result.contactName} in the matched courier conversation.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Courier contact failed");
    } finally {
      setCourierWork(null);
    }
  }
  async function simulateCourierReply(caseId: string) {
    setCourierWork(caseId);
    setFeedback("");
    try {
      await receiveCourier({ caseId, status: "OUT_FOR_DELIVERY", eventTime: new Date().toISOString(), location: "Berlin depot" });
      setFeedback("Courier reply matched. Shopify and customer updates are waiting for separate approvals.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Courier reply could not be matched");
    } finally {
      setCourierWork(null);
    }
  }
  async function applyShopifyNote(approvalId: string) {
    setShopifyWork(approvalId);
    setFeedback("");
    try {
      await approveShopify({ approvalId });
      setFeedback("Approved courier update added to the Shopify order note.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Shopify update failed");
    } finally {
      setShopifyWork(null);
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
                      <>
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
                        {item.orders.length === 1 ? (
                          <button
                            className={styles.investigateButton}
                            onClick={() => runInvestigation(item.id)}
                            disabled={investigatingCase === item.id}
                          >
                            {investigatingCase === item.id ? "Investigating…" : "Run investigation"}
                          </button>
                        ) : (
                          <p>Select one order before running the investigation.</p>
                        )}
                        {investigations[item.id] ? (
                          <section className={styles.investigationResult} aria-live="polite">
                            <header>
                              <div>
                                <small>Investigation complete</small>
                                <strong>{investigations[item.id].order.name}</strong>
                              </div>
                              <time>{new Date(investigations[item.id].collectedAt).toLocaleTimeString()}</time>
                            </header>
                            <div className={styles.investigationFacts}>
                              <div>
                                <small>Previous emails</small>
                                <strong>{investigations[item.id].previousMessages.length}</strong>
                              </div>
                              <div>
                                <small>Fulfillment</small>
                                <strong>{investigations[item.id].order.fulfillmentStatus.replaceAll("_", " ")}</strong>
                              </div>
                              <TrackingFact tracking={investigations[item.id].latestTracking} />
                            </div>
                            {investigations[item.id].previousMessages.map((message) => (
                              <blockquote key={message.id}>
                                <strong>{message.subject}</strong>
                                <p>{message.text}</p>
                              </blockquote>
                            ))}
                          </section>
                        ) : null}
                        {item.customerUpdate ? (
                          <section className={styles.customerUpdate}>
                            <header>
                              <div>
                                <small>Approval required · Customer update</small>
                                <strong>{item.customerUpdate.subject}</strong>
                                <span>To {item.customerUpdate.to}</span>
                              </div>
                              <time>{new Date(item.customerUpdate.proposedAt).toLocaleTimeString()}</time>
                            </header>
                            <p>{item.customerUpdate.text}</p>
                            <button
                              onClick={() => sendCustomerUpdate(item.customerUpdate!.approvalId)}
                              disabled={
                                sendingUpdate === item.customerUpdate.approvalId ||
                                item.customerUpdate.status !== "pending"
                              }
                            >
                              {sendingUpdate === item.customerUpdate.approvalId
                                ? "Sending…"
                                : item.customerUpdate.status === "completed"
                                  ? "Sent"
                                  : item.customerUpdate.status === "failed"
                                    ? "Send failed"
                                    : "Approve and send"}
                            </button>
                          </section>
                        ) : null}
                        {!item.customerUpdate && !item.courierState ? (
                          <button className={styles.investigateButton} onClick={() => waitForCourier(item.id)} disabled={courierWork === item.id}>
                            {courierWork === item.id ? "Opening courier case…" : "Withhold answer and contact courier"}
                          </button>
                        ) : null}
                        {item.courierState ? (
                          <section className={styles.courierState}>
                            <small>Matched courier · {item.courierState.contactName}</small>
                            <strong>{item.courierState.waiting ? "Waiting for reply" : "Reply matched to this case"}</strong>
                            {item.courierState.replyText ? <p>{item.courierState.replyText}</p> : null}
                            {item.courierState.waiting ? (
                              <button onClick={() => simulateCourierReply(item.id)} disabled={courierWork === item.id}>
                                {courierWork === item.id ? "Receiving…" : "Simulate confirmed courier reply"}
                              </button>
                            ) : null}
                          </section>
                        ) : null}
                        {item.shopifyUpdate ? (
                          <section className={styles.shopifyUpdate}>
                            <small>Approval required · Shopify order note</small>
                            <strong>{item.shopifyUpdate.note}</strong>
                            <button onClick={() => applyShopifyNote(item.shopifyUpdate!.approvalId)} disabled={shopifyWork === item.shopifyUpdate.approvalId || item.shopifyUpdate.status !== "pending"}>
                              {shopifyWork === item.shopifyUpdate.approvalId ? "Applying…" : item.shopifyUpdate.status === "completed" ? "Applied" : item.shopifyUpdate.status === "failed" ? "Apply failed" : "Approve Shopify update"}
                            </button>
                          </section>
                        ) : null}
                      </>
                    ) : (
                      <p>No active Shopify orders found for this customer.</p>
                    )}
                  </>
                ) : item.status === "identity_needed" ? (
                  <div className={styles.identityRequest}>
                    <strong>No exact Shopify customer match</strong>
                    <p>No customer or order data was shown.</p>
                    {item.identityRequest ? (
                      <section>
                        <small>Approval required · To {item.identityRequest.to}</small>
                        <strong>{item.identityRequest.subject}</strong>
                        <p>{item.identityRequest.text}</p>
                        <button
                          onClick={() => sendIdentityRequest(item.identityRequest!.approvalId)}
                          disabled={
                            sendingApproval === item.identityRequest.approvalId ||
                            item.identityRequest.status !== "pending"
                          }
                        >
                          {sendingApproval === item.identityRequest.approvalId
                            ? "Sending…"
                            : item.identityRequest.status === "completed"
                              ? "Sent"
                              : item.identityRequest.status === "failed"
                                ? "Send failed"
                                : "Approve and send"}
                        </button>
                      </section>
                    ) : (
                      <p>A safe reply could not be prepared.</p>
                    )}
                  </div>
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
