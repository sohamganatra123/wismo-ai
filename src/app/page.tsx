import Link from "next/link";
import styles from "./page.module.css";

const workflow = [
  { label: "01 · Understand", title: "Reads the request in context", body: "WISMO connects the email to the right customer, order, and earlier conversation." },
  { label: "02 · Verify", title: "Checks the evidence, not just the wording", body: "Tracking numbers must match exactly, and the newest valid scan becomes the current state." },
  { label: "03 · Act", title: "Prepares the next move", body: "Your manager approves the reply or Shopify update. WISMO then carries it out and records every step." },
];

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}

function CheckIcon() {
  return <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="m3.5 8.3 2.7 2.6 6.3-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

export default function Home() {
  return (
    <main>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link className={styles.brand} href="/" aria-label="WISMO home"><span className={styles.brandMark} aria-hidden="true"><span /></span>WISMO</Link>
        <div className={styles.navMeta}>
          <span>Manager-assisted customer ops</span>
          <Link className={styles.navCta} href="/connect">Connect mailbox <ArrowIcon /></Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> Built for “Where is my order?”</p>
          <h1>Delivery questions, investigated before your team opens them.</h1>
          <p className={styles.subhead}>WISMO checks the customer, order, and latest tracking evidence—then prepares the right next action for manager approval.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryCta} href="/connect">Connect support mailbox <ArrowIcon /></Link>
            <p>Google sign-in · One shared Gmail inbox</p>
          </div>
          <div className={styles.promise}>
            <span><CheckIcon /> Exact tracking match</span>
            <span><CheckIcon /> Latest scan verified</span>
            <span><CheckIcon /> Human approval before action</span>
          </div>
        </div>

        <div className={styles.caseStage} aria-label="Example WISMO case investigation">
          <div className={styles.stageHeader}>
            <div><p>Case · WIS-2048</p><strong>Where is my order?</strong></div>
            <span className={styles.attentionBadge}><i /> Needs approval</span>
          </div>
          <div className={styles.customerLine}>
            <span className={styles.avatar}>AM</span>
            <div><strong>Amina M.</strong><span>Order #4921 · Linen overshirt</span></div>
            <time>11:04</time>
          </div>
          <div className={styles.evidence}>
            <p className={styles.panelLabel}>Evidence chain</p>
            <div className={styles.evidenceRow}><span className={styles.evidenceIcon}><CheckIcon /></span><div><strong>Order matched</strong><span>Customer email + order #4921</span></div><em>Exact</em></div>
            <div className={styles.evidenceLine} />
            <div className={styles.evidenceRow}><span className={styles.evidenceIcon}><CheckIcon /></span><div><strong>Tracking matched</strong><span>Shopify and courier · TRK-123</span></div><em>Exact</em></div>
            <div className={styles.evidenceLine} />
            <div className={`${styles.evidenceRow} ${styles.latest}`}><span className={styles.evidenceIcon}>↘</span><div><strong>Delivery failed</strong><span>Newest courier scan · 11:00</span></div><em>Latest</em></div>
          </div>
          <div className={styles.recommendation}>
            <div className={styles.recommendationTop}><p className={styles.panelLabel}>Recommended next step</p><span>Ready for manager</span></div>
            <p>Tell Amina the delivery attempt failed and confirm that the courier will try again.</p>
            <div className={styles.approvalRow}><span>Agent prepared · 42 sec</span><button type="button" disabled>Approve &amp; hand back</button></div>
          </div>
        </div>
      </section>

      <section className={styles.proofStrip} aria-label="Product focus">
        <p>One request type. One accountable workflow.</p>
        <div><strong>30–40</strong><span>daily support requests<br />this workflow is built for</span></div>
        <div><strong>&lt; 2 min</strong><span>target time to<br />first action</span></div>
        <div><strong>100%</strong><span>of external actions<br />reviewed in v1</span></div>
      </section>

      <section className={styles.workflowSection}>
        <div className={styles.sectionIntro}><p className={styles.eyebrow}><span /> From request to resolution</p><h2>Your support agent gets a prepared decision, not another alert.</h2></div>
        <div className={styles.workflowGrid}>
          {workflow.map((item) => <article key={item.label}><p>{item.label}</p><h3>{item.title}</h3><span>{item.body}</span></article>)}
        </div>
      </section>

      <section className={styles.safetySection}>
        <div className={styles.safetyCopy}><p className={styles.eyebrow}><span /> Deliberately manager-assisted</p><h2>Fast investigation.<br />Controlled action.</h2><p>WISMO does the searching, checking, drafting, and follow-up. Your manager remains the approval point while the system proves it can act safely.</p></div>
        <div className={styles.guardrails}>
          <div><span>01</span><p><strong>No mismatched tracking.</strong> Courier data is rejected unless its tracking number exactly matches the Shopify order.</p></div>
          <div><span>02</span><p><strong>No stale delivery claims.</strong> Tracking scans are ordered by event time before a recommendation is prepared.</p></div>
          <div><span>03</span><p><strong>No silent actions.</strong> Messages and Shopify changes wait for manager approval.</p></div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div><p className={styles.eyebrow}><span /> Start with one inbox</p><h2>Give every delivery question a clear next step.</h2></div>
        <Link className={styles.primaryCta} href="/connect">Connect support mailbox <ArrowIcon /></Link>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.brand} href="/"><span className={styles.brandMark} aria-hidden="true"><span /></span>WISMO</Link>
        <p>Manager-assisted customer operations for Shopify teams.</p>
        <span>English · Gmail · Shopify</span>
      </footer>
    </main>
  );
}
