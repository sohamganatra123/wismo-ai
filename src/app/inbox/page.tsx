import Link from "next/link";
import styles from "./page.module.css";

export const metadata = { title: "Human attention · WISMO" };

const cases = [
  {
    id: "WIS-1048",
    customer: "Amina Malik",
    order: "#4921",
    reason: "Tracking conflict",
    deadline: "18 min",
    urgency: "urgent",
    recommendation: "Ask Northline which scan is current before replying to Amina.",
    note: "Shopify says out for delivery; the courier feed says delivery failed.",
  },
  {
    id: "WIS-1046",
    customer: "Jon Bell",
    order: "#4887",
    reason: "Identity needs review",
    deadline: "34 min",
    urgency: "watch",
    recommendation: "Verify the checkout email before showing any order details.",
    note: "The sender address does not match the Shopify customer record.",
  },
  {
    id: "WIS-1041",
    customer: "Mei Tan",
    order: "#4812",
    reason: "Courier did not reply",
    deadline: "52 min",
    urgency: "watch",
    recommendation: "Approve escalation to the store support lead.",
    note: "Three courier follow-ups were sent with no new tracking information.",
  },
];

export default function HumanAttentionInbox() {
  return (
    <main className={styles.shell}>
      <aside className={styles.rail}>
        <Link href="/" className={styles.brand}><i />WISMO</Link>
        <nav aria-label="Product navigation">
          <Link href="/inbox" aria-current="page"><span>Attention</span><b>{cases.length}</b></Link>
          <span aria-disabled="true">Active automation</span>
          <span aria-disabled="true">History</span>
        </nav>
        <div className={styles.boundary}><i /><div><strong>Manager assisted</strong><small>No message sends without approval</small></div></div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.header}>
          <div><p className={styles.eyebrow}>Human attention</p><h1>Three cases need judgment.</h1></div>
          <p>WISMO keeps investigating routine requests. Only blocked or uncertain cases appear here.</p>
        </header>

        <section className={styles.queue} aria-labelledby="queue-title">
          <div className={styles.queueHead}>
            <div><h2 id="queue-title">Needs attention</h2><span>Oldest deadline first</span></div>
            <span className={styles.live}><i /> Live sample</span>
          </div>

          <div className={styles.labels} aria-hidden="true">
            <span>Customer</span><span>Reason</span><span>Recommendation</span><span>Deadline</span>
          </div>

          <div className={styles.caseList}>
            {cases.map((item) => (
              <article className={styles.case} key={item.id}>
                <div className={styles.identity}><span className={styles.avatar}>{item.customer.split(" ").map((part) => part[0]).join("")}</span><div><strong>{item.customer}</strong><small>{item.order} · {item.id}</small></div></div>
                <div className={styles.reason}><strong>{item.reason}</strong><small>{item.note}</small></div>
                <p>{item.recommendation}</p>
                <div className={styles.deadline} data-urgency={item.urgency}><small>Respond within</small><strong>{item.deadline}</strong></div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
