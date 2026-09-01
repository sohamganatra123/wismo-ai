import { getImageProps } from "next/image";
import Link from "next/link";
import type { LandingContent } from "./content";
import { TrackedCta } from "./TrackedCta";
import styles from "../page.module.css";

export function EvidenceHero({ content }: { content: LandingContent["hero"] }) {
  return (
    <div className={styles.heroStage}>
      <HeroPicture />
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={`${styles.heroCopy} ${styles.heroEntrance}`}>
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <p className={styles.heroBrand}>{content.brand}</p>
        <h1 id="hero-title">{content.headline}</h1>
        <p className={styles.heroBody}>{content.body}</p>
        <div className={styles.heroActions}>
          <TrackedCta className={styles.primaryCta} href={content.cta.href} location="hero">
            {content.cta.label}<span aria-hidden="true">↗</span>
          </TrackedCta>
          <Link className={styles.loginCta} href={content.secondaryCta.href}>{content.secondaryCta.label}</Link>
        </div>
        <small className={styles.heroNote}>{content.note}</small>
        <span aria-hidden="true" className={`${styles.autonomyStamp} ${styles.stampEntrance}`}>AUTONOMOUS<br />RESOLUTION</span>
      </div>
    </div>
  );
}

function HeroPicture() {
  const common = { alt: "A parcel, shipping label, and order email arranged on a tactile evidence desk.", sizes: "100vw" };
  const { props: { srcSet: desktop } } = getImageProps({ ...common, src: "/landing/evidence-desk-hero.avif", width: 1536, height: 1024, quality: 75 });
  const { props: { srcSet: mobile, alt, ...rest } } = getImageProps({ ...common, src: "/landing/evidence-desk-hero.avif", width: 1536, height: 1024, quality: 75, fetchPriority: "high" });
  return (
    <picture className={styles.heroPicture}>
      <source media="(min-width: 768px)" srcSet={desktop} />
      <source media="(max-width: 767px)" srcSet={mobile} />
      <img {...rest} alt={alt} className={styles.heroImage} />
    </picture>
  );
}
