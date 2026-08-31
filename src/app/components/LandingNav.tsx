import Link from "next/link";
import styles from "./landing.module.css";

export function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}

export default function LandingNav() {
  return <nav className={styles.nav} aria-label="Main navigation">
    <Link className={styles.brand} href="/" aria-label="WISMO home"><span className={styles.brandOrb} aria-hidden="true" />WISMO</Link>
    <div className={styles.navLinks}><a href="#journey">How it works</a><a href="#control">Your control</a></div>
    <Link className={styles.navCta} href="/connect">Connect mailbox <ArrowIcon /></Link>
  </nav>;
}
