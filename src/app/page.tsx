import Link from "next/link";
import type { CSSProperties } from "react";
import { AutonomousJourney } from "./landing/AutonomousJourney";
import { EvidenceHero } from "./landing/EvidenceHero";
import { LandingNav } from "./landing/LandingNav";
import { TrackedCta } from "./landing/TrackedCta";
import { landingContent } from "./landing/content";
import styles from "./page.module.css";

const sourceLines: Record<string, string> = {
  CUSTOMER: "Sender matched to Shopify customer",
  ORDER: "Order #1048 located",
  FULFILLMENT: "Fulfillment record attached",
  TRACKING: "FR-482-991 verified",
  "PAST EMAILS": "Conversation history checked",
  "LINKED CASES": "No duplicate case found",
  "COURIER REPLIES": "Newest scan returned",
};

export default function HomePage() {
  const content = landingContent;
  return (
    <>
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>
      <LandingNav cta={content.hero.cta} secondaryCta={content.hero.secondaryCta} />
      <main id="main-content" className={styles.page}>
        <section className={styles.hero} aria-labelledby="hero-title"><EvidenceHero content={content.hero} /></section>

        <section className={styles.support} aria-labelledby="support-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{content.support.eyebrow}</p>
            <h2 id="support-title">{content.support.headline}</h2>
            <p>{content.support.body}</p>
          </div>
          <div className={styles.evidenceStrip} aria-label="Sources Wismo checks">
            {content.support.labels.map((label, index) => (
              <details className={styles.evidenceTab} key={label} style={{ "--tab": index } as CSSProperties}>
                <summary><span>{String(index + 1).padStart(2, "0")}</span>{label}</summary>
                <p>{sourceLines[label]}</p>
              </details>
            ))}
          </div>
        </section>

        <AutonomousJourney journey={content.journey} steps={content.journeySteps} />

        <section className={styles.proof} aria-labelledby="proof-title">
          <div className={styles.proofCopy}>
            <p className={styles.eyebrow}>{content.proof.eyebrow}</p>
            <h2 id="proof-title">{content.proof.headline}</h2>
            <p>{content.proof.body}</p>
          </div>
          <ol className={styles.testMarks} aria-label="Results from the first ten-case test">
            {content.proof.results.map((result, index) => <li key={index} data-result={result}><span>{String(index + 1).padStart(2, "0")}</span><strong>{result}</strong></li>)}
          </ol>
          <p className={styles.gateNote}><span>SAFETY GATE</span>{content.proof.gateNote}</p>
        </section>

        <section id="privacy-security" className={styles.trust} aria-labelledby="trust-title">
          <div className={styles.trustIntro}>
            <p className={styles.eyebrow}>{content.trust.eyebrow}</p>
            <h2 id="trust-title">{content.trust.headline}</h2>
            <p>{content.trust.body}</p>
          </div>
          <dl className={styles.trustManifest}>
            {content.trust.items.map((item, index) => (
              <div key={item.label}>
                <dt><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</dt>
                <dd>{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.nextSteps} aria-labelledby="next-title">
          <div className={styles.nextHeading}>
            <p className={styles.eyebrow}>{content.nextSteps.eyebrow}</p>
            <h2 id="next-title">{content.nextSteps.headline}</h2>
          </div>
          <ol>
            {content.nextSteps.steps.map((step) => (
              <li key={step.label}>
                <span>{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.faq} aria-labelledby="faq-title">
          <div className={styles.faqHeading}>
            <p className={styles.eyebrow}>{content.faq.eyebrow}</p>
            <h2 id="faq-title">{content.faq.headline}</h2>
          </div>
          <div className={styles.faqList}>
            {content.faq.items.map((item) => (
              <details key={item.question}>
                <summary>{item.question}<span aria-hidden="true">+</span></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-title">
          <div>
            <p className={styles.eyebrow}>{content.finalCta.eyebrow}</p>
            <h2 id="final-title">{content.finalCta.headline}</h2>
            <p>{content.finalCta.body}</p>
          </div>
          <div className={styles.finalActions}>
            <TrackedCta className={styles.primaryCta} href={content.finalCta.cta.href} location="final">
              {content.finalCta.cta.label}<span aria-hidden="true">↗</span>
            </TrackedCta>
            <Link className={styles.loginCta} href={content.finalCta.secondaryCta.href}>{content.finalCta.secondaryCta.label}</Link>
          </div>
          <footer><span>{content.finalCta.note}</span><span>{content.finalCta.safetyNote}</span><span>{content.finalCta.scopeNote}</span></footer>
        </section>
      </main>
    </>
  );
}
