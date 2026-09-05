import Link from "next/link";
import LiveCases from "./LiveCases";
import styles from "./page.module.css";

export const metadata = { title: "Inbox · WISMO" };

export default function HumanAttentionInbox() {
  return (
    <main className={styles.shell}>
      <aside className={styles.rail}>
        <Link href="/" className={styles.brand}>
          <i />
          WISMO
        </Link>
        <nav aria-label="Product navigation">
          <Link href="/inbox" aria-current="page">
            <span>Inbox</span>
            <b>Live</b>
          </Link>
          <Link href="/inbox/automation">Active automation</Link>
          <Link href="/inbox/history">History</Link>
        </nav>
        <div className={styles.boundary}>
          <i />
          <div>
            <strong>Safe automation</strong>
            <small>Fresh order-status replies can send automatically. Edge cases still wait here.</small>
          </div>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Operations inbox</p>
            <h1>Inbox</h1>
          </div>
          <p>
            Review unclear or risky delivery conversations. Routine replies stay automatic.
          </p>
        </header>

        <LiveCases />
      </section>
    </main>
  );
}
