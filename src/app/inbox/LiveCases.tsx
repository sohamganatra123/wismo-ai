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
  status:
    | "received"
    | "investigating"
    | "identity_needed"
    | "order_needed"
    | "awaiting_approval"
    | "awaiting_courier"
    | "human_attention"
    | "closed";
  agentRunStatus: "queued" | "running" | "waiting" | "completed" | "failed" | "escalated" | null;
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

function formatInboxTime(value: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatThreadTime(value: number) {
  const date = new Date(value);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return new Intl.DateTimeFormat(
    "en",
    isToday ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" },
  ).format(date);
}

function senderLabel(value: string) {
  const match = value.match(/^(.*?)\s*<.+>$/);
  return match?.[1]?.trim() || value;
}

function senderInitial(value: string) {
  return senderLabel(value).trim().charAt(0).toUpperCase() || "?";
}

function messageSnippet(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "(empty message)";
  return text.length > 96 ? `${text.slice(0, 93)}...` : text;
}

function statusLabel(status: ReceivedCase["status"]) {
  switch (status) {
    case "closed":
      return "Auto-replied";
    case "order_needed":
      return "Clarifying";
    case "identity_needed":
      return "Identity check";
    case "awaiting_approval":
      return "Needs approval";
    case "awaiting_courier":
      return "Waiting on courier";
    case "human_attention":
      return "Human review";
    case "investigating":
      return "Investigating";
    default:
      return "New";
  }
}

function CaseState({
  status,
  hasCustomer,
}: {
  status: ReceivedCase["status"];
  hasCustomer: boolean;
}) {
  if (status === "closed") {
    return (
      <section className={styles.caseState} data-tone="done">
        <small>Automatic reply sent</small>
        <strong>Order status was matched from the current CSV snapshot.</strong>
        <p>WISMO replied in the original email thread and closed the case.</p>
      </section>
    );
  }

  if (status === "order_needed") {
    return (
      <section className={styles.caseState} data-tone="watch">
        <small>Clarification sent</small>
        <strong>Waiting for the customer to clarify the order or question.</strong>
        <p>No safe single match was found, so WISMO asked a follow-up question instead of guessing.</p>
      </section>
    );
  }

  if (status === "identity_needed") {
    return (
      <section className={styles.caseState} data-tone="watch">
        <small>Identity check needed</small>
        <strong>Customer details are still being verified.</strong>
        <p>Order details stay hidden until the sender can be matched safely.</p>
      </section>
    );
  }

  if (status === "awaiting_approval") {
    return (
      <section className={styles.caseState} data-tone="watch">
        <small>Approval needed</small>
        <strong>A drafted reply is ready for review.</strong>
        <p>WISMO prepared the next step and is waiting for a human decision.</p>
      </section>
    );
  }

  if (status === "awaiting_courier") {
    return (
      <section className={styles.caseState} data-tone="neutral">
        <small>External follow-up</small>
        <strong>The case is waiting on a courier response.</strong>
        <p>The customer reply is paused until new delivery evidence comes back.</p>
      </section>
    );
  }

  if (status === "human_attention") {
    return (
      <section className={styles.caseState} data-tone="danger">
        <small>Human attention</small>
        <strong>WISMO escalated this case for a manual decision.</strong>
        <p>The available evidence conflicts or the risk is too high for an automatic reply.</p>
      </section>
    );
  }

  if (status === "investigating" && hasCustomer) {
    return (
      <section className={styles.caseState} data-tone="neutral">
        <small>Matched customer</small>
        <strong>Order evidence is available and the case is being checked.</strong>
        <p>WISMO found a customer and order record, then moved into verification.</p>
      </section>
    );
  }

  return (
    <section className={styles.caseState} data-tone="neutral">
      <small>Email received</small>
      <strong>This message has been captured and is waiting for the next safe step.</strong>
      <p>WISMO will either answer, ask for clarification, or send it for review.</p>
    </section>
  );
}

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
    responded: number;
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
const retryAgentRef = makeFunctionReference<
  "mutation",
  { caseId: string },
  string
>("agentRuns:retryFailed");
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
  const retryAgent = useMutation(retryAgentRef);
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
  const [investigations] = useState<Record<string, InvestigationEvidence>>({});
  const [feedback, setFeedback] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
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
            : `${result.responded} status repl${result.responded === 1 ? "y" : "ies"}, ${result.clarified} clarification repl${result.clarified === 1 ? "y" : "ies"}, and ${result.ignored} unrelated message${result.ignored === 1 ? "" : "s"} ignored from ${result.checked} checked message${result.checked === 1 ? "" : "s"}.`,
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
      await retryAgent({ caseId });
      setFeedback("The failed agent run was queued for a safe retry.");
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
          <p className={styles.eyebrow}>Live inbox · Gmail</p>
          <h2>Sign in to review polled cases.</h2>
          <p className={styles.liveDescription}>
            Sign in to see messages received from your connected inbox and the actions WISMO took.
          </p>
        </div>
        <Link className={styles.liveAction} href="/login">
          Sign in to WISMO <span>→</span>
        </Link>
      </section>
    );
  return (
    <section className={styles.liveCases} aria-labelledby="live-cases-title">
      <header>
        <div>
          <p className={styles.eyebrow}>Gmail · checks every minute</p>
          <h2 id="live-cases-title">Delivery conversations</h2>
        </div>
        <button className={styles.pollButton} onClick={pollNow} disabled={working}>
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
          (() => {
            const selected = rows.find((item) => item.id === selectedCaseId) ?? rows[0];
            return (
              <div className={styles.threadShell}>
                <nav className={styles.threadList} aria-label="Email threads">
                  {rows.map((item) => {
                    const active = item.id === selected.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={styles.threadRow}
                        data-active={active}
                        aria-current={active ? "true" : undefined}
                        onClick={() => setSelectedCaseId(item.id)}
                      >
                        <span className={styles.threadAvatar} aria-hidden="true">
                          {senderInitial(item.from)}
                        </span>
                        <div className={styles.threadPreview}>
                          <header>
                            <strong>{senderLabel(item.from)}</strong>
                            <time dateTime={new Date(item.createdAt).toISOString()}>
                              {formatThreadTime(item.createdAt)}
                            </time>
                          </header>
                          <h3>{item.subject}</h3>
                          <p>{messageSnippet(item.text)}</p>
                          <div className={styles.threadMeta}>
                            <small>{statusLabel(item.status)}</small>
                            {item.customer ? <span>Matched to {item.customer.name}</span> : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>

                <article className={styles.threadDetail}>
                  <header className={styles.threadDetailHeader}>
                    <div>
                      <p className={styles.threadDetailLabel}>Conversation</p>
                      <h3>{selected.subject}</h3>
                    </div>
                    <div className={styles.threadDetailMeta}>
                      <strong>{senderLabel(selected.from)}</strong>
                      <span>{formatInboxTime(selected.createdAt)}</span>
                    </div>
                  </header>

                  <div className={styles.messageStack}>
                    <section className={styles.messageBubble}>
                      <header>
                        <div>
                          <strong>{senderLabel(selected.from)}</strong>
                          <small>{selected.from}</small>
                        </div>
                        <time>{formatInboxTime(selected.createdAt)}</time>
                      </header>
                      <p>{selected.text || "(empty message)"}</p>
                    </section>

                    <CaseState status={selected.status} hasCustomer={Boolean(selected.customer)} />

                    {selected.agentRunStatus === "failed" ? (
                      <button
                        className={`${styles.actionButton} ${styles.investigateButton}`}
                        onClick={() => runInvestigation(selected.id)}
                        disabled={investigatingCase === selected.id}
                      >
                        {investigatingCase === selected.id ? "Retrying…" : "Retry failed agent"}
                      </button>
                    ) : null}

                    <div className={styles.shopifyEvidence}>
                      {selected.customer ? (
                        <>
                          <header>
                            <div>
                              <small>Exact order match</small>
                              <strong>{selected.customer.name}</strong>
                              <span>{selected.customer.email}</span>
                            </div>
                            <b>{selected.orders.length} active</b>
                          </header>
                          {selected.orders.length ? (
                            <>
                              <div className={styles.orderEvidence}>
                                {selected.orders.map((order) => (
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
                              {selected.orders.length !== 1 ? (
                                <p>Select one order before running the investigation.</p>
                              ) : selected.agentRunStatus !== "failed" ? (
                                <p>WISMO is investigating this case automatically.</p>
                              ) : null}
                              {investigations[selected.id] ? (
                                <section className={styles.investigationResult} aria-live="polite">
                                  <header>
                                    <div>
                                      <small>Investigation complete</small>
                                      <strong>{investigations[selected.id].order.name}</strong>
                                    </div>
                                    <time>{new Date(investigations[selected.id].collectedAt).toLocaleTimeString()}</time>
                                  </header>
                                  <div className={styles.investigationFacts}>
                                    <div>
                                      <small>Previous emails</small>
                                      <strong>{investigations[selected.id].previousMessages.length}</strong>
                                    </div>
                                    <div>
                                      <small>Fulfillment</small>
                                      <strong>{investigations[selected.id].order.fulfillmentStatus.replaceAll("_", " ")}</strong>
                                    </div>
                                    <TrackingFact tracking={investigations[selected.id].latestTracking} />
                                  </div>
                                  {investigations[selected.id].previousMessages.map((message) => (
                                    <blockquote key={message.id}>
                                      <strong>{message.subject}</strong>
                                      <p>{message.text}</p>
                                    </blockquote>
                                  ))}
                                </section>
                              ) : null}
                              {selected.customerUpdate ? (
                                <section className={styles.customerUpdate}>
                                  <header>
                                    <div>
                                      <small>Approval required · Customer update</small>
                                      <strong>{selected.customerUpdate.subject}</strong>
                                      <span>To {selected.customerUpdate.to}</span>
                                    </div>
                                    <time>{new Date(selected.customerUpdate.proposedAt).toLocaleTimeString()}</time>
                                  </header>
                                  <p>{selected.customerUpdate.text}</p>
                                  <button
                                    className={styles.actionButton}
                                    onClick={() => sendCustomerUpdate(selected.customerUpdate!.approvalId)}
                                    disabled={
                                      sendingUpdate === selected.customerUpdate.approvalId ||
                                      selected.customerUpdate.status !== "pending"
                                    }
                                  >
                                    {sendingUpdate === selected.customerUpdate.approvalId
                                      ? "Sending…"
                                      : selected.customerUpdate.status === "completed"
                                        ? "Sent"
                                        : selected.customerUpdate.status === "failed"
                                          ? "Send failed"
                                          : "Approve and send"}
                                  </button>
                                </section>
                              ) : null}
                              {!selected.customerUpdate && !selected.courierState ? (
                                <button className={`${styles.actionButton} ${styles.investigateButton}`} onClick={() => waitForCourier(selected.id)} disabled={courierWork === selected.id}>
                                  {courierWork === selected.id ? "Opening courier case…" : "Withhold answer and contact courier"}
                                </button>
                              ) : null}
                              {selected.courierState ? (
                                <section className={styles.courierState}>
                                  <small>Matched courier · {selected.courierState.contactName}</small>
                                  <strong>{selected.courierState.waiting ? "Waiting for reply" : "Reply matched to this case"}</strong>
                                  {selected.courierState.replyText ? <p>{selected.courierState.replyText}</p> : null}
                                  {selected.courierState.waiting ? (
                                    <button className={styles.actionButton} onClick={() => simulateCourierReply(selected.id)} disabled={courierWork === selected.id}>
                                      {courierWork === selected.id ? "Receiving…" : "Simulate confirmed courier reply"}
                                    </button>
                                  ) : null}
                                </section>
                              ) : null}
                              {selected.shopifyUpdate ? (
                                <section className={styles.shopifyUpdate}>
                                  <small>Approval required · Shopify order note</small>
                                  <strong>{selected.shopifyUpdate.note}</strong>
                                  <button className={styles.actionButton} onClick={() => applyShopifyNote(selected.shopifyUpdate!.approvalId)} disabled={shopifyWork === selected.shopifyUpdate.approvalId || selected.shopifyUpdate.status !== "pending"}>
                                    {shopifyWork === selected.shopifyUpdate.approvalId ? "Applying…" : selected.shopifyUpdate.status === "completed" ? "Applied" : selected.shopifyUpdate.status === "failed" ? "Apply failed" : "Approve Shopify update"}
                                  </button>
                                </section>
                              ) : null}
                            </>
                          ) : (
                            <p>No active orders found for this customer.</p>
                          )}
                        </>
                      ) : selected.status === "identity_needed" ? (
                        <div className={styles.identityRequest}>
                          <strong>No exact customer match</strong>
                          <p>No customer or order data was shown.</p>
                          {selected.identityRequest ? (
                            <section>
                              <small>Approval required · To {selected.identityRequest.to}</small>
                              <strong>{selected.identityRequest.subject}</strong>
                              <p>{selected.identityRequest.text}</p>
                              <button
                                className={styles.actionButton}
                                onClick={() => sendIdentityRequest(selected.identityRequest!.approvalId)}
                                disabled={
                                  sendingApproval === selected.identityRequest.approvalId ||
                                  selected.identityRequest.status !== "pending"
                                }
                              >
                                {sendingApproval === selected.identityRequest.approvalId
                                  ? "Sending…"
                                  : selected.identityRequest.status === "completed"
                                    ? "Sent"
                                    : selected.identityRequest.status === "failed"
                                      ? "Send failed"
                                      : "Approve and send"}
                              </button>
                            </section>
                          ) : (
                            <p>A safe reply could not be prepared.</p>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <dl>
                      <div>
                        <dt>Gmail conversation ID</dt>
                        <dd>{selected.threadId}</dd>
                      </div>
                      <div>
                        <dt>Gmail message ID</dt>
                        <dd>{selected.providerId}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              </div>
            );
          })()
        )}
      </div>
    </section>
  );
}
