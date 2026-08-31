import Link from "next/link";
import { cases } from "./caseData";
import styles from "./page.module.css";

export const metadata = { title: "Human attention · WISMO" };

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
              <Link className={styles.case} href={`/inbox/${item.id}`} key={item.id} aria-label={`Open ${item.customer}, order ${item.order}`}>
                <div className={styles.identity}><span className={styles.avatar}>{item.initials}</span><div><strong>{item.customer}</strong><small>{item.order} · {item.id}</small></div></div>
                <div className={styles.reason}><strong>{item.reason}</strong><small>{item.note}</small></div>
                <p>{item.recommendation}</p>
                <div className={styles.deadline} data-urgency={item.urgency}><small>Respond within</small><strong>{item.deadline}</strong></div>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
