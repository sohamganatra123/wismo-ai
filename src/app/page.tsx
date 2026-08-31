import Link from "next/link";
import AgentJourney from "./components/AgentJourney";
import EvidenceDesk from "./components/EvidenceDesk";
import LandingNav, { ArrowIcon } from "./components/LandingNav";
import Reveal from "./components/Reveal";
import styles from "./page.module.css";

export default function Home() {
  return <main>
    <LandingNav />

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span /> A quieter support day starts here</p>
        <h1>Get delivery questions off your daily to-do list.</h1>
        <p className={styles.subhead}>Your customers get fast, accurate updates that feel personal. You get the full investigation and a clear next step—without searching through Shopify and courier pages yourself.</p>
        <div className={styles.heroActions}><Link className={styles.primaryCta} href="/connect">Connect support mailbox <ArrowIcon /></Link><span>One shared Gmail inbox<br />You approve every action in v1</span></div>
      </div>
      <EvidenceDesk />
    </section>

    <section className={styles.outcomes} aria-label="Benefits for owners and customers">
      <Reveal className={styles.outcomeIntro}><p className={styles.eyebrow}><span /> The better day</p><h2>Less chasing for you.<br />Better answers for them.</h2></Reveal>
      <div className={styles.outcomeGrid}>
        <Reveal className={styles.outcomeCard}><span className={styles.outcomeNumber}>For your team</span><h3>Review the decision.<br />Skip the detective work.</h3><p>No more opening five tabs to answer one small question. WISMO gathers the customer, order, conversation, and delivery evidence before asking for your attention.</p><div className={styles.beforeAfter}><span>Before</span><s>Search. Compare. Chase. Remember.</s><span>With WISMO</span><strong>Review one prepared next step.</strong></div></Reveal>
        <Reveal className={`${styles.outcomeCard} ${styles.customerCard}`}><span className={styles.outcomeNumber}>For your customer</span><h3>A quick answer that doesn’t sound automated.</h3><p>Specific order details. Plain words. A clear next step. Customers get a reply that understands what they asked and tells them what happens now.</p><blockquote>“You don’t need to do anything right now. I’ll keep an eye on it.”</blockquote></Reveal>
      </div>
    </section>

    <AgentJourney />

    <section className={styles.definition}>
      <Reveal><p className={styles.eyebrow}><span /> What WISMO does</p><h2>WISMO investigates delivery questions and prepares the reply.</h2></Reveal>
      <div className={styles.definitionRail}><span>Email arrives</span><i>→</i><span>Order checked</span><i>→</i><span>Courier verified</span><i>→</i><span>Manager reviews</span></div>
    </section>

    <section className={styles.control} id="control">
      <Reveal className={styles.controlCopy}><p className={styles.eyebrow}><span /> Human where it matters</p><h2>Stay in control without doing the investigation yourself.</h2><p>WISMO handles the repetitive searching and follow-up. Your manager remains the decision point for every customer message and Shopify change in v1.</p></Reveal>
      <Reveal className={styles.decisionCard}>
        <div className={styles.decisionTop}><span>Recommended next step</span><strong>Ready for manager</strong></div>
        <h3>Tell Amina the courier will try again tomorrow.</h3>
        <ul><li><span>✓</span>Customer and order match</li><li><span>✓</span>Tracking number matches exactly</li><li><span>✓</span>Newest scan used</li></ul>
        <div className={styles.decisionActions}><button type="button">Approve &amp; hand back</button><button type="button">Add guidance</button></div>
        <small>Product demonstration · No message will be sent</small>
      </Reveal>
    </section>

    <section className={styles.finalCta}>
      <p className={styles.eyebrow}><span /> Start with one inbox</p>
      <h2>Give customers an answer before the question becomes a complaint.</h2>
      <Link className={styles.primaryCta} href="/connect">Connect support mailbox <ArrowIcon /></Link>
      <span>Shared Gmail inbox · Shopify · Manager approval in v1</span>
    </section>

    <footer className={styles.footer}><span>WISMO</span><p>Delivery support with evidence and a human touch.</p><small>English · Gmail · Shopify</small></footer>
  </main>;
}
