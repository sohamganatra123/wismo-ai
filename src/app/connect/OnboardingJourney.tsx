"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import styles from "./page.module.css";
import { onboardingReducer } from "./onboardingReducer";
import { initialOnboardingState, type OnboardingStep, type TestStatus, type VoiceProfile } from "./onboardingTypes";
import { loadOnboarding, saveOnboarding } from "./onboardingStorage";
import { analyzeStore, connectGmail, connectShopify, runTestOrder } from "./simulatedConnections";

const steps: { id: OnboardingStep; label: string; hint: string }[] = [
  { id: "account", label: "Your account", hint: "Local setup" }, { id: "gmail", label: "Gmail", hint: "Customer questions" },
  { id: "shopify", label: "Your store", hint: "Storefront signal" }, { id: "voice", label: "Your voice", hint: "Store character" },
  { id: "test", label: "Test WISMO", hint: "Proof run" }, { id: "launch", label: "Go live", hint: "WISMO only" },
];

function Badge() { return <span className={styles.simulation}>Simulation</span>; }
function Header({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <header className={styles.stepHeader}><p>{eyebrow}</p><h1>{title}</h1><span>{text}</span></header>; }

export default function OnboardingJourney() {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);
  const restored = useRef(false);
  useEffect(() => { queueMicrotask(() => dispatch({ type: "RESTORED", state: loadOnboarding() })); }, []);
  useEffect(() => { if (restored.current) saveOnboarding(state); else restored.current = true; }, [state]);
  const current = steps.findIndex((item) => item.id === state.step);
  return <div className={styles.page}>
    <aside className={styles.rail}><Link href="/" className={styles.brand}><i aria-hidden="true" />WISMO</Link><div className={styles.railIntro}><p>Setup room</p><strong>Connect what WISMO needs.</strong></div><ol>{steps.map((item, index) => <li key={item.id} data-state={index < current ? "done" : index === current ? "current" : "upcoming"} aria-current={index === current ? "step" : undefined}><button type="button" disabled={index > current} onClick={() => dispatch({ type: "GO_BACK", step: item.id })}><span>{index < current ? "✓" : index + 1}</span><div><strong>{item.label}</strong><small>{item.hint}</small></div></button></li>)}</ol><div className={styles.railNote}><Badge /><p>No external account is connected in this demo.</p></div></aside>
    <div className={styles.mobileProgress}><Link href="/" className={styles.brand}><i />WISMO</Link><span>{current + 1} of 6 · {steps[current].label}</span><progress value={current + 1} max="6" /></div>
    <main className={styles.workspace} key={state.step}>
      {state.step === "account" ? <AccountStep savedName={state.name} savedEmail={state.email} onDone={(name, email) => dispatch({ type: "ACCOUNT_COMPLETED", name, email })} /> : null}
      {state.step === "gmail" ? <GmailStep email={state.email} status={state.gmail} onStart={() => dispatch({ type: "GMAIL_CONNECT_STARTED" })} onDone={() => dispatch({ type: "GMAIL_CONNECTED" })} onError={() => dispatch({ type: "GMAIL_FAILED" })} /> : null}
      {state.step === "shopify" ? <ShopifyStep status={state.shopify} onStart={(domain) => dispatch({ type: "SHOPIFY_CONNECT_STARTED", domain })} onDone={(domain, voice) => dispatch({ type: "SHOPIFY_CONNECTED", domain, voice })} onError={() => dispatch({ type: "SHOPIFY_FAILED" })} /> : null}
      {state.step === "voice" && state.voice ? <VoiceStep voice={state.voice} onChange={(voice) => dispatch({ type: "VOICE_UPDATED", voice })} onDone={() => dispatch({ type: "VOICE_ACCEPTED" })} /> : null}
      {state.step === "test" ? <TestStep email={state.email} status={state.testStatus} onStart={() => dispatch({ type: "TEST_STARTED" })} onEvent={(status) => dispatch({ type: "TEST_ADVANCED", status })} onError={() => dispatch({ type: "TEST_FAILED" })} /> : null}
      {state.step === "launch" ? <LaunchStep state={state} onActivate={() => dispatch({ type: "AUTOMATION_ACTIVATED" })} /> : null}
    </main>
  </div>;
}

function AccountStep({ savedName, savedEmail, onDone }: { savedName: string; savedEmail: string; onDone: (name: string, email: string) => void }) {
  const [name, setName] = useState(savedName); const [email, setEmail] = useState(savedEmail); const [password, setPassword] = useState(""); const [show, setShow] = useState(false); const [error, setError] = useState("");
  function submit(event: React.FormEvent) { event.preventDefault(); if (!name.trim()) return setError("Enter your name."); if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid work email."); if (password.length < 10) return setError("Use at least 10 characters for your password."); onDone(name.trim(), email.trim()); }
  return <section className={styles.step}><Header eyebrow="02 · Your account" title="Now, make it yours." text="Create the local account that will own this WISMO setup." /><div className={styles.notice}><Badge /><p>This demo saves your progress on this device. Your password is never stored.</p></div><form className={styles.form} onSubmit={submit} noValidate><label>Full name<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Avery Morgan" /></label><label>Work email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="avery@northstar-goods.com" /></label><label>Password<div className={styles.password}><input type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="10 characters or more" /><button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button></div></label>{error ? <p className={styles.error} role="alert">{error}</p> : null}<button className={styles.primary} type="submit">Create account <span>→</span></button></form></section>;
}

function GmailStep({ email, status, onStart, onDone, onError }: { email: string; status: string; onStart: () => void; onDone: () => void; onError: () => void }) {
  async function connect() { onStart(); try { await connectGmail(email); onDone(); } catch { onError(); } }
  return <section className={styles.step}><Header eyebrow="02 · Gmail" title="Bring in the questions." text="WISMO needs one inbox to spot delivery questions and prepare replies." /><div className={styles.permissionCard}><div className={styles.serviceTitle}><span className={styles.gmailMark}>M</span><div><small>Continue as</small><strong>{email}</strong></div><Badge /></div><ul><li><span>↙</span><div><strong>Read delivery questions</strong><small>Only messages WISMO identifies as order-status requests.</small></div></li><li><span>↗</span><div><strong>Prepare replies</strong><small>Nothing leaves the product during this simulation.</small></div></li></ul><button className={styles.primary} disabled={status === "connecting"} onClick={connect}>{status === "connecting" ? "Connecting simulated Gmail…" : status === "error" ? "Try again" : "Approve simulated connection"} <span>→</span></button></div></section>;
}

function ShopifyStep({ status, onStart, onDone, onError }: { status: string; onStart: (domain: string) => void; onDone: (domain: string, voice: VoiceProfile) => void; onError: () => void }) {
  const [domain, setDomain] = useState(""); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(domain.trim())) return setError("Enter a valid Shopify or storefront address.");
    setError(""); onStart(domain);
    try { const store = await connectShopify(domain); const voice = await analyzeStore(); onDone(store.domain, voice); }
    catch { onError(); setError("The simulated connection failed. Check the address and try again."); }
  }
  const connecting = status === "connecting";
  return <section className={`${styles.step} ${styles.storeStep}`}>
    <Header eyebrow="03 · Your Shopify store" title="Show us where you sell." text="We’ll use your storefront to understand what you sell and how your brand speaks. No Shopify login yet." />
    <form className={styles.storeEntry} onSubmit={submit} aria-busy={connecting}>
      <div className={styles.storeEntryTop}><span className={styles.shopifyMark}>S</span><div><strong>Find your storefront</strong><small>Paste the address customers visit</small></div><Badge /></div>
      <label htmlFor="shopify-domain">Shopify store URL</label>
      <div className={styles.storeUrl}><span aria-hidden="true">https://</span><input id="shopify-domain" value={domain} disabled={connecting} onChange={(e) => setDomain(e.target.value.replace(/^https?:\/\//, ""))} placeholder="northstar-goods.myshopify.com" autoComplete="url" autoFocus aria-describedby="domain-help" /></div>
      <small className={styles.domainHelp} id="domain-help">You can also enter your custom storefront domain.</small>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {connecting ? <div className={styles.storeScan} role="status"><div className={styles.scanTrack}><i /></div><div className={styles.scanSteps}><span data-active="true">Checking store</span><span>Reading storefront</span><span>Learning your voice</span></div></div> : null}
      <button className={styles.primary} disabled={connecting || !domain.trim()}>{connecting ? "Getting to know your store…" : "Continue with this store"} <span>→</span></button>
    </form>
    <p className={styles.storeFootnote}><i aria-hidden="true">✓</i> Simulation only. Nothing is installed and no store data is changed.</p>
  </section>;
}

function VoiceStep({ voice, onChange, onDone }: { voice: VoiceProfile; onChange: (voice: VoiceProfile) => void; onDone: () => void }) {
  return <section className={`${styles.step} ${styles.voiceStep}`}><Header eyebrow="04 · Your voice" title="This already feels like your store." text="WISMO found a reply style in your storefront copy and theme. Tune it before the proof run." /><div className={styles.voiceSpecimen} style={{ "--store-ink": voice.ink, "--store-canvas": voice.canvas, "--store-accent": voice.accent } as React.CSSProperties}><header><div><small>Voice fingerprint</small><h2>{voice.storeName}</h2></div><div className={styles.swatches}><i style={{ background: voice.ink }} /><i style={{ background: voice.canvas }} /><i style={{ background: voice.accent }} /></div></header><div className={styles.traits}>{voice.traits.map((trait, index) => <label key={`${index}-${trait}`}>Trait {index + 1}<span><input value={trait} onChange={(event) => onChange({ ...voice, traits: voice.traits.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} /><button type="button" aria-label={`Remove ${trait || `trait ${index + 1}`}`} onClick={() => onChange({ ...voice, traits: voice.traits.filter((_, itemIndex) => itemIndex !== index) })}>×</button></span></label>)}</div><blockquote><small>Example customer reply</small><p>{voice.greeting} the courier tried to deliver your parcel this morning and will try again tomorrow. You don’t need to do anything right now.</p><footer>WISMO · using simulated order facts</footer></blockquote><div className={styles.voiceFields}><label>Opening<input value={voice.greeting} onChange={(e) => onChange({ ...voice, greeting: e.target.value })} /></label><label>Response guidance<textarea value={voice.guidance} onChange={(e) => onChange({ ...voice, guidance: e.target.value })} /></label></div></div><button className={styles.primary} onClick={onDone} disabled={!voice.greeting.trim() || !voice.guidance.trim() || voice.traits.every((trait) => !trait.trim())}>Use this voice <span>→</span></button></section>;
}

function TestStep({ email, status, onStart, onEvent, onError }: { email: string; status: TestStatus; onStart: () => void; onEvent: (s: TestStatus) => void; onError: () => void }) {
  async function run() { onStart(); try { await runTestOrder(onEvent); } catch { onError(); } }
  const stages = [{ name: "Customer email", text: `Received in ${email}` }, { name: "Shopify order", text: "#TEST-4921 · Amina M." }, { name: "Courier status", text: "Delivery attempted · 11:00" }, { name: "WISMO reply", text: "Prepared in simulation" }];
  const rank: Record<TestStatus, number> = { idle: -1, sending: -1, received: 0, checking: 2, prepared: 3, error: -1 };
  return <section className={styles.step}><Header eyebrow="05 · Proof run" title="Watch one answer come together." text="Use a seeded Shopify test order to see exactly what WISMO checks before it prepares a reply." /><div className={styles.testOrder}><div><small>Selected test order</small><strong>#TEST-4921</strong><span>Amina M. · Delivery attempted</span></div><Badge /></div><ol className={styles.trace}>{stages.map((stage, index) => <li key={stage.name} data-done={rank[status] >= index}><span>{rank[status] >= index ? "✓" : index + 1}</span><div><strong>{stage.name}</strong><small>{stage.text}</small></div></li>)}</ol><p className={styles.srOnly} aria-live="polite">Test status: {status}</p><button className={styles.primary} disabled={status !== "idle" && status !== "error"} onClick={run}>{status === "idle" || status === "error" ? "Run simulated test" : "Proof run in progress…"} <span>→</span></button></section>;
}

function LaunchStep({ state, onActivate }: { state: { active: boolean; email: string; shopDomain: string; voice: VoiceProfile | null }; onActivate: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  if (state.active) return <section className={`${styles.step} ${styles.receipt}`}><span className={styles.liveMark}>✓</span><Header eyebrow="Setup complete" title="WISMO is ready." text="Automation is active in this simulation for order-status questions only." /><dl><div><dt>Inbox</dt><dd>{state.email}</dd></div><div><dt>Store</dt><dd>{state.shopDomain}</dd></div><div><dt>Voice</dt><dd>{state.voice?.storeName}</dd></div><div><dt>Scope</dt><dd>“Where is my order?” emails</dd></div></dl><p className={styles.activeNote}>Automation active in simulation</p><Link className={styles.secondary} href="/support-web">See WISMO at work <span>→</span></Link></section>;
  return <section className={styles.step}><Header eyebrow="06 · Go live" title="Choose the boundary." text="The proof run is complete. Turn on only the automation you have reviewed." /><div className={styles.boundary}><Badge /><h2>WISMO will answer one kind of question.</h2><label className={styles.check}><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /><span><strong>Automatically reply to “Where is my order?” emails</strong><small>Using the simulated Gmail inbox, Shopify facts, and your accepted voice.</small></span></label><div className={styles.exclusions}><small>WISMO will not automatically handle</small><span>Address changes</span><span>Refunds</span><span>Delivery conflicts</span></div></div><button className={styles.primary} disabled={!confirmed} onClick={onActivate}>Activate WISMO replies <span>→</span></button></section>;
}
