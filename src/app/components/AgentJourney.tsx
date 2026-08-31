"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import CaseCapsuleFallback from "./CaseCapsuleFallback";
import styles from "./landing.module.css";

const CaseCapsuleScene = dynamic(() => import("./CaseCapsuleScene"), { ssr: false });

const steps = [
  { state: "Request", title: "Ask once", guide: "Amina asked where her order is.", body: "Her email and earlier conversation stay connected, so she doesn’t have to repeat herself.", fact: "Email received · 10:58" },
  { state: "Order", title: "Get checked", guide: "I found the right order.", body: "WISMO matches the customer and order before using any delivery information.", fact: "Order #4921 · exact match" },
  { state: "Tracking", title: "Get the latest truth", guide: "I checked the newest matching update.", body: "The tracking number must match exactly. Then the newest valid scan becomes the answer.", fact: "TRK-123 · scan at 11:00" },
  { state: "Approval", title: "Stay in control", guide: "Your reply is ready to review.", body: "You review one clear recommendation. WISMO sends it and remembers the follow-up.", fact: "3 sources checked · ready" },
];

export default function AgentJourney() {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [openFact, setOpenFact] = useState<number | null>(null);
  const refs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(Number((visible.target as HTMLElement).dataset.step));
    }, { rootMargin: "-28% 0px -45%", threshold: [0,.25,.6] });
    refs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return <section className={styles.journey} id="journey">
    <div className={styles.journeyIntro}><span>WISMO, in one case</span><h2>From “Where is it?”<br />to a clear answer.</h2><p>Follow one delivery question as WISMO does the detective work and keeps the human conversation intact.</p></div>
    <div className={styles.journeyGrid}>
      <div className={styles.stickyStage}>
        <div className={styles.stageChrome}><span className={styles.liveDot} /> Case journey <code>WIS-2048</code></div>
        {reduceMotion ? <CaseCapsuleFallback stage={active} /> : <CaseCapsuleScene stage={active} />}
        <div className={styles.agentGuide} aria-live="polite"><span className={styles.agentAvatar}>W</span><div><small>WISMO agent</small><strong>{steps[active].guide}</strong></div></div>
        <button className={styles.evidenceButton} type="button" aria-expanded={openFact === active} onClick={() => setOpenFact(openFact === active ? null : active)}>View the evidence</button>
        {openFact === active ? <div className={styles.evidencePopover}><small>Source checked</small><strong>{steps[active].fact}</strong><button type="button" onClick={() => setOpenFact(null)} aria-label="Close evidence">×</button></div> : null}
      </div>
      <div className={styles.journeySteps}>
        {steps.map((step, index) => <article key={step.state} data-step={index} ref={(node) => { refs.current[index] = node; }} className={index === active ? styles.activeStep : ""}>
          <span>{step.state}</span><h3>{step.title}</h3><p>{step.body}</p>
        </article>)}
      </div>
    </div>
  </section>;
}
