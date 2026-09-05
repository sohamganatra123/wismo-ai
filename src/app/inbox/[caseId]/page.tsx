import Link from "next/link";
import { notFound } from "next/navigation";
import CaseActions from "./CaseActions";
import { cases, getCase } from "../caseData";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export function generateStaticParams() { return cases.map((item) => ({ caseId: item.id })); }

export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const item = getCase(caseId);
  if (!item) notFound();

  const escalationReason = item.reason;
  const escalationStage = item.urgency === "urgent" ? "Needs a manager decision now" : "Waiting in the manager review lane";
  const escalationDetail =
    item.reason === "Tracking conflict"
      ? "Customer reply is withheld because the courier and Shopify disagree."
      : item.reason === "Courier did not reply"
        ? "Automated follow-ups were exhausted without a fresh tracking answer."
        : "WISMO stopped before exposing order details without a verified identity match.";
  const escalationNextStep =
    item.reason === "Tracking conflict"
      ? "Confirm which tracking scan is current, then approve the next customer update."
      : item.reason === "Courier did not reply"
        ? "Escalate this case to store support and set a manual follow-up owner."
        : "Approve a safe identity check before any order details are shared.";
  const auditEvents = [
    ...item.steps.map((step, index) => ({
      label: step.state === "blocked" ? "Escalation trigger" : "System check",
      title: step.title,
      detail: step.detail,
      time: step.time,
      tone: step.state === "blocked" ? "alert" : "neutral",
      key: `step-${index}-${step.title}`,
    })),
    ...item.messages.map((message, index) => ({
      label: message.from === "WISMO" ? "Outbound note" : "Conversation",
      title: message.from,
      detail: message.text,
      time: message.time,
      tone: message.from === "WISMO" ? "neutral" : "soft",
      key: `message-${index}-${message.from}-${message.time}`,
    })),
  ];

  return <main className={styles.shell}>
    <aside className={styles.rail}><Link href="/" className={styles.brand}><i />WISMO</Link><nav><Link href="/inbox">← Human attention</Link><span>Case {item.id}</span></nav><div className={styles.boundary}><i /><div><strong>Manager assisted</strong><small>No action runs without your decision</small></div></div></aside>
    <section className={styles.workspace}>
      <header className={styles.caseHeader}><div><p className={styles.eyebrow}>{item.id} · Human attention</p><h1>{item.reason}</h1><p>{item.note}</p></div><div className={styles.clock}><small>Respond within</small><strong>{item.deadline}</strong></div></header>
      <div className={styles.layout}>
        <div className={styles.story}>
          <section className={styles.escalationPanel}>
            <header><div><p className={styles.eyebrow}>Escalation</p><h2>{escalationStage}</h2></div><span className={styles.escalationBadge} data-urgency={item.urgency}>{item.urgency === "urgent" ? "Urgent" : "Watch"}</span></header>
            <div className={styles.escalationGrid}>
              <article><small>Reason</small><strong>{escalationReason}</strong><p>{escalationDetail}</p></article>
              <article><small>Recommended next step</small><strong>{item.recommendation}</strong><p>{escalationNextStep}</p></article>
              <article><small>Current boundary</small><strong>No automated send is allowed</strong><p>A manager must approve the next outward action before WISMO continues.</p></article>
            </div>
          </section>
          <section className={styles.question}><span>{item.initials}</span><div><small>{item.customer} · Today at 11:18</small><p>“{item.question}”</p></div></section>
          <section className={styles.evidence}><header><p className={styles.eyebrow}>Evidence route</p><h2>What WISMO checked</h2></header><div className={styles.evidenceGrid}><article><small>Customer</small><strong>{item.customer}</strong><span>{item.email}</span><span>{item.customerSince}</span><b>Exact sender match</b></article><article><small>Shopify order</small><strong>{item.order}</strong><span>{item.product}</span><span>{item.orderDate}</span><b>{item.fulfillment}</b></article><article data-conflict><small>Newest tracking</small><strong>{item.trackingStatus}</strong><span>{item.trackingNumber}</span><span>{item.trackingTime}</span><b>Conflicts with Shopify</b></article></div></section>
          <section className={styles.panel}><header><p className={styles.eyebrow}>Agent steps</p><h2>Decision trail</h2></header><ol className={styles.steps}>{item.steps.map((step, index) => <li key={step.title} data-state={step.state}><b>{String(index + 1).padStart(2,"0")}</b><div><strong>{step.title}</strong><p>{step.detail}</p></div><time>{step.time}</time></li>)}</ol></section>
          <section className={styles.panel}><header><p className={styles.eyebrow}>Audit trail</p><h2>Case events</h2></header><p className={styles.auditHint}>Showing a UI-ready sample trail from the current case page data. Replace this with a Convex case-events query when available.</p><ol className={styles.auditTrail}>{auditEvents.map((event, index) => <li key={event.key} data-tone={event.tone}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{event.label}</small><strong>{event.title}</strong><p>{event.detail}</p></div><time>{event.time}</time></li>)}</ol></section>
          <div className={styles.split}><section className={styles.panel}><header><p className={styles.eyebrow}>Previous messages</p><h2>Conversation</h2></header><div className={styles.messages}>{item.messages.map((message) => <article key={`${message.from}-${message.time}`}><div><strong>{message.from}</strong><time>{message.time}</time></div><p>{message.text}</p></article>)}</div></section><section className={styles.panel}><header><p className={styles.eyebrow}>Linked cases</p><h2>Related history</h2></header>{item.linkedCases.length ? item.linkedCases.map((related) => <article className={styles.linked} key={related.id}><span>{related.id}</span><strong>{related.title}</strong><small>{related.outcome}</small></article>) : <p className={styles.empty}>No earlier case is linked to this order.</p>}</section></div>
        </div>
        <aside className={styles.decision}><section className={styles.recommendation}><p className={styles.eyebrow}>WISMO recommends</p><h2>{item.recommendation}</h2><p>This keeps the customer waiting until the conflicting evidence is resolved.</p></section><CaseActions /></aside>
      </div>
    </section>
  </main>;
}
