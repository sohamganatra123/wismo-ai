import styles from "./landing.module.css";

export default function EvidenceDesk() {
  return <div className={styles.evidenceDesk} aria-label="Example of a WISMO reply and the evidence behind it">
    <div className={styles.glow} aria-hidden="true" />
    <article className={`${styles.deskCard} ${styles.requestCard}`}>
      <span className={styles.cardLabel}>Customer email · 10:58</span>
      <strong>“Hi, do you know where my linen overshirt is?”</strong>
      <small>Amina M. · Conversation 8472</small>
    </article>
    <article className={`${styles.deskCard} ${styles.orderCard}`}>
      <span className={styles.cardLabel}>Shopify order</span>
      <div><strong>#4921</strong><span className={styles.verified}>Exact customer match</span></div>
      <code>TRK-123</code>
    </article>
    <article className={`${styles.deskCard} ${styles.trackCard}`}>
      <span className={styles.cardLabel}>Newest courier scan · 11:00</span>
      <strong>Delivery attempt missed</strong>
      <div><code>TRK-123</code><span className={styles.verified}>Exact tracking match</span></div>
    </article>
    <article className={`${styles.deskCard} ${styles.replyCard}`}>
      <div className={styles.replyTop}><span className={styles.agentDot} /> <span>Reply prepared for review</span></div>
      <p>Hi Amina — I checked order #4921. The courier tried to deliver it this morning and will try again tomorrow. You don’t need to do anything right now. I’ll keep an eye on it.</p>
      <div className={styles.replyBottom}><span>Checked against 3 sources</span><button type="button" disabled>Manager reviews</button></div>
    </article>
  </div>;
}
