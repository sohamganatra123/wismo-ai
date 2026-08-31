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

export function SupportWorld() {
  const source = useMemo(() => createMockEventSource(), []);
  const { tickets, handled, endToEnd } = useSupportSimulation(source);
  const { progress, scene } = useScrollScene();
  const [traceOpen, setTraceOpen] = useState(false);
  const activeSystem = scene === 3 ? (progress < .45 ? "Shopify" : progress < .53 ? "History" : "Courier") : "";
  const fallback = [{ id: "10482", customer: "Amina M.", question: "Where is my order?", state: "incoming" as const, receivedAt: 0 }];
  const headline = scene === 0 ? <>Every request<br/>moves forward.</> : scene < 3 ? <>One question.<br/>Clearly understood.</> : scene === 3 ? <>The right answer<br/>starts with truth.</> : scene < 6 ? <>Back in seconds.<br/>Ready for review.</> : scene === 6 ? <>Fast doesn’t mean<br/>unexplained.</> : <>Less detective work.<br/>Faster answers.</>;
  const supporting = scene === 0 ? "WISMO handles delivery questions while your team stays in control." : scene < 3 ? "Amina asked where order #4921 is. WISMO matches the customer before it moves." : scene === 3 ? `Checking ${activeSystem || "connected systems"} now.` : scene < 6 ? "A specific answer for Amina, backed by matching evidence." : scene === 6 ? "Open the case to see what WISMO understood, checked, and decided." : "Give customers accurate answers without spending your day chasing order updates.";
  return <main className={styles.journey} data-scene={scene}>
    <div className={styles.stage}>
      <div className={styles.ambient} aria-hidden="true"/>
      <header className={styles.hud}><Link href="/" className={styles.brand}><i>W</i><span>WISMO</span></Link><div className={styles.live}><i/> Live operation <span>{handled} handled today</span></div><Link href="/connect" className={styles.connect}>Connect mailbox <b>↗</b></Link></header>
      <div className={styles.guide}><span>{String(scene + 1).padStart(2,"0")} · {SCENES[scene]}</span><h1>{headline}</h1><p>{supporting}</p></div>
      <section className={styles.intake} aria-label="Incoming support requests"><span className={styles.zoneLabel}>Incoming</span>{(tickets.length ? tickets : fallback).map((ticket,index)=><article key={ticket.id} style={{"--ticket":index} as CSSProperties} className={ticket.state === "resolved" ? styles.ticketDone : ""}><small>{ticket.state === "resolved" ? "Resolved" : "New · Email"}</small><strong>{ticket.question}</strong><span>{ticket.customer} · #{ticket.id}</span></article>)}</section>
      <section className={styles.desk} aria-label="WISMO agent workspace"><div className={styles.agent} aria-label="WISMO"><div className={styles.head}><i/></div><div className={styles.body}/><span>WISMO</span></div><div className={styles.bubble} aria-hidden="true"><i/></div><article className={styles.message}><header><span>Customer · Amina M.</span><b>Order #4921</b></header><p>“Hi, do you know where my linen overshirt is?”</p><footer>Delivery status · High confidence</footer><i className={styles.scan}/></article></section>
      <section className={styles.systemWeb} aria-label="Connected support systems"><span className={styles.zoneLabel}>Sources of truth</span>{SYSTEMS.map(system=><article key={system.name} data-active={activeSystem === system.name}><i>{system.name[0]}</i><div><small>{system.name}</small><strong>{system.value}</strong></div><em>{activeSystem === system.name ? "Checking" : "Ready"}</em></article>)}</section>
      <div className={styles.routes} aria-hidden="true"><i/><i/><i/></div>
      <section className={styles.evidence} aria-label="Verified evidence"><span>Evidence returned</span><strong>Order matched</strong><strong>Tracking verified</strong><strong>Newest scan · 11:00</strong></section>
      <button className={styles.answer} onClick={()=>setTraceOpen(true)}><span>Answer ready · 00:42</span><p>Hi Amina — the courier tried to deliver your parcel this morning and will try again tomorrow. You don’t need to do anything right now.</p><strong>Ready for manager review <i>✓</i></strong><small>Click to see why</small></button>
      <button className={styles.human} onClick={()=>setTraceOpen(true)}><span>Human judgment</span><strong>Tracking conflict</strong><small>No customer message prepared</small></button>
      <div className={styles.finalCta}><span>Ready when you are</span><h2>Put delivery questions<br/>on autopilot.</h2><Link href="/connect">Connect your support mailbox <b>↗</b></Link><small>Customer messages require manager approval in v1.</small></div>
      <nav className={styles.progress} aria-label="Journey progress"><span>{SCENES[scene]}</span><div><i style={{transform:`scaleX(${progress})`}}/></div><b>{String(scene+1).padStart(2,"0")} / 08</b></nav>
      <div className={styles.metrics}><span>{endToEnd}% end-to-end</span><span>42 sec median first action</span></div>
    </div>
    <div className={styles.chapters} aria-hidden="true">{SCENES.map(name=><div key={name}/>)}</div>
    <CaseTrace open={traceOpen} onClose={()=>setTraceOpen(false)}/>
  </main>;
}
