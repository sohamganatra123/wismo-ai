import Link from "next/link";
import type { LandingContent } from "./content";
import styles from "../page.module.css";

type Props = Pick<LandingContent["hero"], "cta" | "secondaryCta">;

export function LandingNav({ cta, secondaryCta }: Props) {
  return (
    <header className={styles.nav}>
      <Link className={styles.navBrand} href="/" aria-label="Wismo.ai home">WISMO.ai</Link>
      <nav aria-label="Main navigation">
        <Link className={styles.navHow} href="#how-it-works">How it works</Link>
        <Link className={styles.loginCta} href={secondaryCta.href}>{secondaryCta.label}</Link>
        <Link className={styles.navPrimary} href={cta.href}>{cta.label}<span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}
