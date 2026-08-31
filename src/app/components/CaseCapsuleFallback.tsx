import styles from "./landing.module.css";

export default function CaseCapsuleFallback({ stage = 0 }: { stage?: number }) {
  return <div className={styles.fallbackScene} aria-hidden="true">
    <div className={`${styles.capsuleCss} ${styles[`capsuleStage${stage}`]}`}><span /><i /></div>
    <div className={styles.routeLine}><span style={{ width: `${(stage + 1) * 25}%` }} /></div>
    <div className={styles.routeDots}>{[0,1,2,3].map((item) => <i key={item} className={item <= stage ? styles.routeActive : ""} />)}</div>
  </div>;
}
