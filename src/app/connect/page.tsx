import Link from "next/link";
import styles from "./page.module.css";

export const metadata = { title: "Connect support mailbox — WISMO" };

export default function ConnectMailboxPage() {
  return <main className={styles.page}>
    <Link className={styles.brand} href="/" aria-label="Back to WISMO home"><span aria-hidden="true">←</span> WISMO</Link>
    <section className={styles.card}>
      <p className={styles.eyebrow}>Mailbox connection</p>
      <h1>Google sign-in comes in Milestone 4.</h1>
      <p>This page is the safe connection placeholder for the landing-page milestone. No Gmail account has been connected and no email permissions have been requested.</p>
      <div className={styles.status}><span /> Not connected</div>
      <Link className={styles.back} href="/">Return to landing page</Link>
    </section>
  </main>;
}
