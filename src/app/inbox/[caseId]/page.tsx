import Link from "next/link";
import { notFound } from "next/navigation";
import CaseActions from "./CaseActions";
import { cases, getCase } from "../caseData";
import styles from "./page.module.css";

export function generateStaticParams() { return cases.map((item) => ({ caseId: item.id })); }

export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const item = getCase(caseId);
  if (!item) notFound();

  return <main className={styles.shell}>
    <aside className={styles.rail}><Link href="/" className={styles.brand}><i />WISMO</Link><nav><Link href="/inbox">← Human attention</Link><span>Case {item.id}</span></nav><div className={styles.boundary}><i /><div><strong>Manager assisted</strong><small>No action runs without your decision</small></div></div></aside>
    <section className={styles.workspace}>
      <header className={styles.caseHeader}><div><p className={styles.eyebrow}>{item.id} · Human attention</p><h1>{item.reason}</h1><p>{item.note}</p></div><div className={styles.clock}><small>Respond within</small><strong>{item.deadline}</strong></div></header>
      <div className={styles.layout}>
        <div className={styles.story}>
          <section className={styles.question}><span>{item.initials}</span><div><small>{item.customer} · Today at 11:18</small><p>“{item.question}”</p></div></section>
          <section className={styles.evidence}><header><p className={styles.eyebrow}>Evidence route</p><h2>What WISMO checked</h2></header><div className={styles.evidenceGrid}><article><small>Customer</small><strong>{item.customer}</strong><span>{item.email}</span><span>{item.customerSince}</span><b>Exact sender match</b></article><article><small>Shopify order</small><strong>{item.order}</strong><span>{item.product}</span><span>{item.orderDate}</span><b>{item.fulfillment}</b></article><article data-conflict><small>Newest tracking</small><strong>{item.trackingStatus}</strong><span>{item.trackingNumber}</span><span>{item.trackingTime}</span><b>Conflicts with Shopify</b></article></div></section>
          <section className={styles.panel}><header><p className={styles.eyebrow}>Agent steps</p><h2>Decision trail</h2></header><ol className={styles.steps}>{item.steps.map((step, index) => <li key={step.title} data-state={step.state}><b>{String(index + 1).padStart(2,"0")}</b><div><strong>{step.title}</strong><p>{step.detail}</p></div><time>{step.time}</time></li>)}</ol></section>
          <div className={styles.split}><section className={styles.panel}><header><p className={styles.eyebrow}>Previous messages</p><h2>Conversation</h2></header><div className={styles.messages}>{item.messages.map((message) => <article key={`${message.from}-${message.time}`}><div><strong>{message.from}</strong><time>{message.time}</time></div><p>{message.text}</p></article>)}</div></section><section className={styles.panel}><header><p className={styles.eyebrow}>Linked cases</p><h2>Related history</h2></header>{item.linkedCases.length ? item.linkedCases.map((related) => <article className={styles.linked} key={related.id}><span>{related.id}</span><strong>{related.title}</strong><small>{related.outcome}</small></article>) : <p className={styles.empty}>No earlier case is linked to this order.</p>}</section></div>
        </div>
        <aside className={styles.decision}><section className={styles.recommendation}><p className={styles.eyebrow}>WISMO recommends</p><h2>{item.recommendation}</h2><p>This keeps the customer waiting until the conflicting evidence is resolved.</p></section><CaseActions /></aside>
      </div>
    </section>
  </main>;
}
