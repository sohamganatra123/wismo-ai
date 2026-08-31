"use client";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { createMockEventSource } from "./mockEventSource";
import { useSupportSimulation } from "./useSupportSimulation";
import { useScrollScene } from "./useScrollScene";
import { CaseTrace } from "./CaseTrace";
import styles from "./supportWorld.module.css";

const SCENES = ["Live", "Open", "Understand", "Investigate", "Answer", "Decide", "Inspect", "Connect"];
const SYSTEMS = [{name:"Shopify",value:"#4921 · exact match"},{name:"History",value:"3 related messages"},{name:"Courier",value:"TRK-123 · latest scan"}];
const EVIDENCE = ["Order matched", "Tracking verified", "Newest scan · 11:00"];

function getInvestigationState(progress: number, scene: number) {
  if (scene < 3) return { leg: 0, travel: 0, activeSystem: "", evidenceCount: 0 };
  if (scene > 3) return { leg: 5, travel: 1, activeSystem: "", evidenceCount: 3 };

  const localProgress = Math.min(1, Math.max(0, (progress - 0.36) / (0.62 - 0.36)));
  const legProgress = localProgress * 6;
  const leg = Math.min(5, Math.floor(legProgress));
  const travel = leg === 5 && localProgress === 1 ? 1 : legProgress - leg;
  const sourceIndex = Math.floor(leg / 2);
  const nearSource = leg % 2 === 0 ? travel >= 0.72 : travel <= 0.28;
  const evidenceCount = Math.min(3, Math.floor(legProgress / 2));

  return {
    leg,
    travel,
    activeSystem: nearSource ? SYSTEMS[sourceIndex].name : "",
    evidenceCount,
  };
}

export function SupportWorld() {
  const source = useMemo(() => createMockEventSource(), []);
  const { tickets, handled, endToEnd } = useSupportSimulation(source);
  const { progress, scene } = useScrollScene();
  const [traceOpen, setTraceOpen] = useState(false);
  const investigation = getInvestigationState(progress, scene);
  const { activeSystem } = investigation;
  const fallback = [{ id: "10482", customer: "Amina M.", question: "Where is my order?", state: "incoming" as const, receivedAt: 0 }];
  const headline = scene === 0 ? <>Every request<br/>moves forward.</> : scene < 3 ? <>One question.<br/>Clearly understood.</> : scene === 3 ? <>The right answer<br/>starts with truth.</> : scene < 6 ? <>Back in seconds.<br/>Ready for review.</> : scene === 6 ? <>Fast doesn’t mean<br/>unexplained.</> : <>Less detective work.<br/>Faster answers.</>;
  const supporting = scene === 0 ? "WISMO handles delivery questions while your team stays in control." : scene < 3 ? "Amina asked where order #4921 is. WISMO matches the customer before it moves." : scene === 3 ? `Checking ${activeSystem || "connected systems"} now.` : scene < 6 ? "A specific answer for Amina, backed by matching evidence." : scene === 6 ? "Open the case to see what WISMO understood, checked, and decided." : "Give customers accurate answers without spending your day chasing order updates.";
  return <main className={styles.journey} data-scene={scene}>
    <div className={styles.stage}>
      <div className={styles.ambient} aria-hidden="true"/>
      <header className={styles.hud}><Link href="/" className={styles.brand}><i>W</i><span>WISMO</span></Link><div className={styles.live}><i/> Manager-assisted demo <span>{handled} sample cases</span></div><Link href="/connect" className={styles.connect}>Connect support mailbox <b>↗</b></Link></header>
      <div className={styles.guide}><span>{String(scene + 1).padStart(2,"0")} · {SCENES[scene]}</span><h1>{headline}</h1><p>{supporting}</p></div>
      <section className={styles.intake} aria-label="Incoming support requests"><span className={styles.zoneLabel}>Incoming</span>{(tickets.length ? tickets : fallback).map((ticket,index)=><article key={ticket.id} style={{"--ticket":index} as CSSProperties} className={ticket.state === "resolved" ? styles.ticketDone : ""}><small>{ticket.state === "resolved" ? "Resolved" : "New · Email"}</small><strong>{ticket.question}</strong><span>{ticket.customer} · #{ticket.id}</span></article>)}</section>
      <div
        className={styles.agentMover}
        data-form={scene > 0 && scene < 4 ? "orb" : "body"}
        data-leg={scene === 3 ? investigation.leg : undefined}
        style={{ "--travel": investigation.travel } as CSSProperties}
        aria-label="WISMO"
      ><div className={styles.agent}><div className={styles.head}><i/></div><div className={styles.body}/><div className={styles.orb}><i/></div><span>WISMO</span></div></div>
      <section className={styles.desk} aria-label="WISMO agent workspace"><article className={styles.message}><header><span>Customer · Amina M.</span><b>Order #4921</b></header><p>“Hi, do you know where my linen overshirt is?”</p><footer>Delivery status · High confidence</footer><i className={styles.scan}/></article></section>
      <section className={styles.systemWeb} aria-label="Connected support systems"><span className={styles.zoneLabel}>Sources of truth</span>{SYSTEMS.map(system=><article key={system.name} data-active={activeSystem === system.name}><i>{system.name[0]}</i><div><small>{system.name}</small><strong>{system.value}</strong></div><em>{activeSystem === system.name ? "Checking" : "Ready"}</em></article>)}</section>
      <section className={styles.evidence} aria-label="Verified evidence"><span>Evidence returned</span>{EVIDENCE.map((item,index)=><strong key={item} data-visible={index < investigation.evidenceCount}>{item}</strong>)}</section>
      <button className={styles.answer} onClick={()=>setTraceOpen(true)}><span>Answer ready · 00:42</span><p>Hi Amina — the courier tried to deliver your parcel this morning and will try again tomorrow. You don’t need to do anything right now.</p><strong>Ready for manager review <i>✓</i></strong><small>Click to see why</small></button>
      <button className={styles.human} onClick={()=>setTraceOpen(true)}><span>Human judgment</span><strong>Tracking conflict</strong><small>No customer message prepared</small></button>
      <div className={styles.finalCta}><span>Ready when you are</span><h2>Get delivery answers<br/>ready for review.</h2><Link href="/connect">Connect support mailbox <b>↗</b></Link><small>Customer and courier messages, and Shopify changes, require manager approval in V1.</small></div>
      <nav className={styles.progress} aria-label="Journey progress"><span>{SCENES[scene]}</span><div><i style={{transform:`scaleX(${progress})`}}/></div><b>{String(scene+1).padStart(2,"0")} / 08</b></nav>
      <div className={styles.metrics}><span>{endToEnd}% sample evidence match</span><span>Manager approval required</span></div>
    </div>
    <div className={styles.chapters} aria-hidden="true">{SCENES.map(name=><div key={name}/>)}</div>
    <CaseTrace open={traceOpen} onClose={()=>setTraceOpen(false)}/>
  </main>;
}
