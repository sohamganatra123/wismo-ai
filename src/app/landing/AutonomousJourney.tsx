"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { JourneyStep, LandingContent } from "./content";
import styles from "../page.module.css";

type Props = { journey: LandingContent["journey"]; steps: JourneyStep[] };

export function AutonomousJourney({ journey, steps }: Props) {
  const root = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const pointerX = useMotionValue(0);
  const scanNudge = useSpring(pointerX, { stiffness: 420, damping: 32 });
  const { scrollYProgress } = useScroll({ target: root, offset: ["start start", "end end"] });
  const slipY = useTransform(scrollYProgress, [0, 0.16], ["-55%", "0%"]);
  const boxX = useTransform(scrollYProgress, [0.02, 0.2], ["-14%", "0%"]);
  const scanY = useTransform(scrollYProgress, [0.16, 0.34], ["-78%", "82%"]);
  const scanOpacity = useTransform(scrollYProgress, [0.12, 0.18, 0.34, 0.4], [0, 1, 1, 0]);
  const rejectOpacity = useTransform(scrollYProgress, [0.23, 0.29, 0.38, 0.44], [0, 1, 1, 0]);
  const courierLine = useTransform(scrollYProgress, [0.38, 0.58], [0, 1]);
  const signalX = useTransform(scrollYProgress, [0.38, 0.52, 0.66], ["0%", "310%", "0%"]);
  const signalOpacity = useTransform(scrollYProgress, [0.34, 0.4, 0.64, 0.7], [0, 1, 1, 0]);
  const courierOpacity = useTransform(scrollYProgress, [0.4, 0.48, 0.65, 0.72], [0, 1, 1, 0]);
  const replyX = useTransform(scrollYProgress, [0.66, 0.86], ["42%", "0%"]);
  const replyOpacity = useTransform(scrollYProgress, [0.62, 0.72, 0.88, 0.94], [0, 1, 1, 0]);
  const resolvedScale = useTransform(scrollYProgress, [0.76, 0.86], [1.18, 1]);
  const resolvedOpacity = useTransform(scrollYProgress, [0.76, 0.84], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const next = Math.min(4, Math.floor(latest * 5));
    setActiveStep((current) => current === next ? current : next);
  });

  function nudgeScanner(event: ReactPointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((((event.clientX - bounds.left) / bounds.width) - 0.5) * 12);
  }

  return (
    <section ref={root} id="how-it-works" className={styles.sequence} aria-labelledby="workflow-title">
      <div className={styles.sequenceCopy}>
        <div className={styles.sequenceIntro}>
          <p className={styles.modeLabel}>{journey.modeLabel}</p>
          <p className={styles.eyebrow}>{journey.eyebrow}</p>
          <h2 id="workflow-title">{journey.headline}</h2>
        </div>
        <ol className={styles.journeySteps}>
          {steps.map((step, index) => (
            <li key={step.label} data-active={activeStep === index}>
              <span>{String(index + 1).padStart(2, "0")} / {step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <StaticJourneyFrame label={step.label} />
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.journeyViewport} aria-hidden="true" onPointerMove={nudgeScanner} onPointerLeave={() => pointerX.set(0)}>
        <div className={styles.journeyStage}>
          <div className={styles.stageHeader}><span>AUTONOMOUS / GATE CLEARED</span><b>0 HUMAN HANDOFFS</b></div>
          <motion.div className={styles.inboxSlip} style={{ y: slipY }}><small>INCOMING / 09:17</small><strong>WHERE IS ORDER #1048?</strong></motion.div>
          <motion.div className={styles.parcel} style={{ x: boxX }}><i /><span>ORDER #1048</span><b>FR-482-991</b><em>SHOPIFY MATCH</em></motion.div>
          <motion.i className={styles.scanBeam} style={{ x: scanNudge, y: scanY, opacity: scanOpacity }} />
          <motion.span className={styles.rejectedTracking} style={{ opacity: rejectOpacity }}>FR-291-118 <b>REJECTED</b></motion.span>
          <motion.div className={styles.courierRoute} style={{ scaleX: courierLine }} />
          <motion.span className={styles.agentSignal} style={{ x: signalX, opacity: signalOpacity }}>W</motion.span>
          <motion.div className={styles.courierDesk} style={{ opacity: courierOpacity }}><span>COURIER CHECKPOINT</span><strong>DELIVERY ATTEMPTED</strong><small>NEWEST SCAN · 14:42</small></motion.div>
          <motion.div className={styles.sentReply} style={{ x: replyX, opacity: replyOpacity }}><span>REPLY SENT / 14:43</span><p>The courier tried to deliver your parcel today and will try again tomorrow.</p><small>Sources attached · brand voice applied</small></motion.div>
          <motion.strong className={styles.resolvedStamp} style={{ scale: resolvedScale, opacity: resolvedOpacity }}>RESOLVED<br />AUTONOMOUSLY</motion.strong>
        </div>
      </div>
    </section>
  );
}

const staticFrameCopy: Record<JourneyStep["label"], string> = {
  RECEIVE: "Email received · Order #1048",
  SCAN: "Wismo scan · FR-482-991 matched · FR-291-118 rejected",
  "CHECK COURIER": "Courier status · Delivery attempted · 14:42",
  REPLY: "Verified update · Reply sent · 14:43",
  RESOLVE: "Case #1048 · Resolved autonomously",
};

function StaticJourneyFrame({ label }: { label: JourneyStep["label"] }) {
  return <div className={styles.staticJourneyFrame} aria-hidden="true"><span>{staticFrameCopy[label]}</span></div>;
}
