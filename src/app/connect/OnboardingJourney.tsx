"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import {
  agentStatusForState,
  autonomyModeContent,
  autonomyModes,
  journeyStages,
  stageForStep,
  type AgentStatus,
} from "./onboardingContent";
import { onboardingReducer } from "./onboardingReducer";
import { loadOnboarding, saveOnboarding } from "./onboardingStorage";
import {
  initialOnboardingState,
  type AutonomyMode,
  type ConnectionStatus,
  type TestStatus,
  type VoiceProfile,
} from "./onboardingTypes";
import { analyzeStore, connectGmail, connectShopify, runTestOrder } from "./simulatedConnections";
import styles from "./page.module.css";

function GuideBadge() {
  return <span className={styles.guideBadge}>Guided setup</span>;
}

function StepHeader({ number, eyebrow, title, text }: { number: string; eyebrow: string; title: string; text: string }) {
  return (
    <header className={styles.stepHeader}>
      <p><span>{number}</span>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{text}</span>
    </header>
  );
}

function AgentStatusPanel({ status, compact = false }: { status: AgentStatus; compact?: boolean }) {
  return (
    <div className={compact ? styles.mobileAgent : styles.agentPanel} data-tone={status.tone} aria-live="polite">
      <span className={styles.agentMark} aria-hidden="true">W</span>
      <div>
        <small>WISMO agent</small>
        <strong>{status.label}</strong>
        {compact ? null : <p>{status.detail}</p>}
      </div>
    </div>
  );
}

export default function OnboardingJourney() {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);
  const restored = useRef(false);

  useEffect(() => {
    queueMicrotask(() => dispatch({ type: "RESTORED", state: loadOnboarding() }));
  }, []);

  useEffect(() => {
    if (restored.current) saveOnboarding(state);
    else restored.current = true;
  }, [state]);

  const visualStage = stageForStep(state.step);
  const current = journeyStages.findIndex((stage) => stage.id === visualStage.id);
  const agentStatus = agentStatusForState(state);

  return (
    <div className={styles.page}>
      <aside className={styles.rail}>
        <Link href="/" className={styles.brand}>WISMO<span>.ai</span></Link>
        <div className={styles.railIntro}>
          <p>Agent brief</p>
          <strong>Prepare one trusted worker.</strong>
        </div>
        <ol className={styles.manifest}>
          {journeyStages.map((stage, index) => {
            const stepState = index < current ? "done" : index === current ? "current" : "upcoming";
            return (
              <li key={stage.id} data-state={stepState} aria-current={stepState === "current" ? "step" : undefined}>
                <button type="button" disabled={index > current} onClick={() => dispatch({ type: "GO_BACK", step: stage.reducerStep })}>
                  <span>{stage.number}</span>
                  <div><strong>{stage.label}</strong><small>{stage.hint}</small></div>
                  <em>{stepState === "done" ? "Verified" : stepState === "current" ? "Current" : "Locked"}</em>
                </button>
              </li>
            );
          })}
        </ol>
        <AgentStatusPanel status={agentStatus} />
        <div className={styles.railNote}><GuideBadge /><p>No external account or customer message changes in this walkthrough.</p></div>
      </aside>

      <header className={styles.mobileProgress}>
        <div className={styles.mobileTopline}>
          <Link href="/" className={styles.brand}>WISMO<span>.ai</span></Link>
          <span>Step {current + 1} of 5 · {visualStage.label}</span>
        </div>
        <div className={styles.progressTrack} role="progressbar" aria-label="Onboarding progress" aria-valuemin={1} aria-valuemax={5} aria-valuenow={current + 1}>
          <i style={{ transform: `scaleX(${(current + 1) / 5})` }} />
        </div>
        <AgentStatusPanel status={agentStatus} compact />
      </header>

      <main className={styles.workspace} key={visualStage.id}>
        {state.step === "account" ? <BriefStep savedName={state.name} savedEmail={state.email} onDone={(name, email) => dispatch({ type: "ACCOUNT_COMPLETED", name, email })} /> : null}
        {state.step === "gmail" || state.step === "shopify" ? (
          <EvidenceStep
            email={state.email}
            gmail={state.gmail}
            shopify={state.shopify}
            savedDomain={state.shopDomain}
            onGmailStart={() => dispatch({ type: "GMAIL_CONNECT_STARTED" })}
            onGmailDone={() => dispatch({ type: "GMAIL_CONNECTED" })}
            onGmailError={() => dispatch({ type: "GMAIL_FAILED" })}
            onShopifyStart={(domain) => dispatch({ type: "SHOPIFY_CONNECT_STARTED", domain })}
            onShopifyDone={(domain, voice) => dispatch({ type: "SHOPIFY_CONNECTED", domain, voice })}
            onShopifyError={() => dispatch({ type: "SHOPIFY_FAILED" })}
          />
        ) : null}
        {state.step === "voice" && state.voice ? <VoiceStep voice={state.voice} onChange={(voice) => dispatch({ type: "VOICE_UPDATED", voice })} onDone={() => dispatch({ type: "VOICE_ACCEPTED" })} /> : null}
        {state.step === "test" ? <ProofStep email={state.email} status={state.testStatus} onStart={() => dispatch({ type: "TEST_STARTED" })} onEvent={(status) => dispatch({ type: "TEST_ADVANCED", status })} onError={() => dispatch({ type: "TEST_FAILED" })} /> : null}
        {state.step === "launch" ? <ControlStep state={state} onModeChange={(mode) => dispatch({ type: "AUTONOMY_SELECTED", mode })} onActivate={() => dispatch({ type: "AUTOMATION_ACTIVATED" })} onEdit={() => dispatch({ type: "EDIT_AUTONOMY" })} /> : null}
      </main>
    </div>
  );
}

function BriefStep({ savedName, savedEmail, onDone }: { savedName: string; savedEmail: string; onDone: (name: string, email: string) => void }) {
  const [name, setName] = useState(savedName);
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid work email.");
    if (password.length < 10) return setError("Use at least 10 characters for your password.");
    onDone(name.trim(), email.trim());
  }

  return (
    <section className={styles.step}>
      <StepHeader number="01" eyebrow="Brief" title="Give WISMO one clear mission." text="Set the owner and the boundary before the agent sees a customer question." />
      <div className={styles.mission}>
        <div><small>Agent mission</small><strong>Resolve “Where is my order?” questions</strong></div>
        <p>Find the customer, verify the order and newest courier scan, then act only inside the control level you choose.</p>
      </div>
      <div className={styles.guideNote}><GuideBadge /><p>Progress stays on this device. Your password is never stored.</p></div>
      <form className={styles.form} onSubmit={submit} noValidate>
        <label htmlFor="owner-name">Your name<input id="owner-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Avery Morgan" /></label>
        <label htmlFor="owner-email">Work email<input id="owner-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="avery@northstar-goods.com" /></label>
        <label htmlFor="owner-password">Password<span className={styles.password}><input id="owner-password" type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="10 characters or more" /><button type="button" onClick={() => setShow((value) => !value)}>{show ? "Hide" : "Show"}</button></span></label>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <button className={styles.primary} type="submit">Brief this agent <span aria-hidden="true">→</span></button>
      </form>
    </section>
  );
}

type EvidenceStepProps = {
  email: string;
  gmail: ConnectionStatus;
  shopify: ConnectionStatus;
  savedDomain: string;
  onGmailStart: () => void;
  onGmailDone: () => void;
  onGmailError: () => void;
  onShopifyStart: (domain: string) => void;
  onShopifyDone: (domain: string, voice: VoiceProfile) => void;
  onShopifyError: () => void;
};

function EvidenceStep(props: EvidenceStepProps) {
  const [domain, setDomain] = useState(props.savedDomain);
  const [error, setError] = useState("");
  const gmailReady = props.gmail === "connected";
  const storeWorking = props.shopify === "connecting";

  async function connectInbox() {
    props.onGmailStart();
    try { await connectGmail(props.email); props.onGmailDone(); }
    catch { props.onGmailError(); }
  }

  async function connectStore(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(domain.trim())) return setError("Enter a valid Shopify or storefront address.");
    setError("");
    props.onShopifyStart(domain);
    try {
      const store = await connectShopify(domain);
      const voice = await analyzeStore();
      props.onShopifyDone(store.domain, voice);
    } catch {
      props.onShopifyError();
      setError("The guided store check stopped. Check the address and try again.");
    }
  }

  return (
    <section className={`${styles.step} ${styles.evidenceStep}`}>
      <StepHeader number="02" eyebrow="Evidence" title="Give your agent sources of truth." text="WISMO needs the question from Gmail and the order facts from Shopify before it can make a safe judgment." />
      <div className={styles.sourceStack}>
        <article className={styles.sourcePanel} data-state={gmailReady ? "verified" : props.gmail === "connecting" ? "working" : "current"}>
          <header><span>Source 01</span><div><strong>Gmail</strong><small>Customer questions</small></div><em>{gmailReady ? "Verified" : props.gmail === "connecting" ? "Checking" : "Required"}</em></header>
          {gmailReady ? (
            <div className={styles.sourceReceipt}><div><small>Inbox available to WISMO</small><strong>{props.email}</strong></div><button type="button" onClick={connectInbox}>Check again</button></div>
          ) : (
            <div className={styles.sourceBody}>
              <ul>
                <li><span>Read</span><p><strong>Find delivery questions</strong><small>Only messages identified as order-status requests.</small></p></li>
                <li><span>Write</span><p><strong>Prepare customer replies</strong><small>No message leaves this guided setup.</small></p></li>
              </ul>
              <button className={styles.primary} type="button" disabled={props.gmail === "connecting"} onClick={connectInbox}>{props.gmail === "connecting" ? "Checking inbox access…" : props.gmail === "error" ? "Try inbox again" : "Give inbox access"}<span aria-hidden="true">→</span></button>
            </div>
          )}
        </article>

        <article className={styles.sourcePanel} data-state={!gmailReady ? "locked" : storeWorking ? "working" : props.shopify === "connected" ? "verified" : "current"}>
          <header><span>Source 02</span><div><strong>Shopify</strong><small>Order and storefront facts</small></div><em>{!gmailReady ? "Locked" : storeWorking ? "Learning" : props.shopify === "connected" ? "Verified" : "Required"}</em></header>
          {!gmailReady ? <p className={styles.lockedCopy}>Verify Gmail first. WISMO checks evidence in the same order it will use on a real case.</p> : (
            <form className={styles.storeForm} onSubmit={connectStore} aria-busy={storeWorking}>
              <label htmlFor="shopify-domain">Storefront address</label>
              <div className={styles.storeUrl}><span aria-hidden="true">https://</span><input id="shopify-domain" value={domain} disabled={storeWorking} onChange={(event) => setDomain(event.target.value.replace(/^https?:\/\//, ""))} placeholder="northstar-goods.myshopify.com" autoComplete="url" aria-describedby="domain-help" /></div>
              <small id="domain-help">Your public Shopify or custom storefront domain.</small>
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              {storeWorking ? <div className={styles.scanStatus} role="status"><div><i /></div><ol><li>Checking store</li><li>Reading storefront</li><li>Learning voice</li></ol></div> : null}
              <button className={styles.primary} disabled={storeWorking || !domain.trim()}>{storeWorking ? "WISMO is reading the store…" : props.shopify === "connected" ? "Read this store again" : "Give store context"}<span aria-hidden="true">→</span></button>
            </form>
          )}
        </article>
      </div>
      <p className={styles.externalNote}><GuideBadge />No account is connected and no store data changes in this walkthrough.</p>
    </section>
  );
}

function VoiceStep({ voice, onChange, onDone }: { voice: VoiceProfile; onChange: (voice: VoiceProfile) => void; onDone: () => void }) {
  return (
    <section className={`${styles.step} ${styles.voiceStep}`}>
      <StepHeader number="03" eyebrow="Voice" title="Correct what WISMO learned." text="The agent inferred a reply style from your storefront. Tune the specimen before it handles the proof case." />
      <div className={styles.voiceSpecimen} style={{ "--store-ink": voice.ink, "--store-canvas": voice.canvas, "--store-accent": voice.accent } as CSSProperties}>
        <header><div><small>Voice fingerprint</small><h2>{voice.storeName}</h2></div><div className={styles.swatches} aria-label="Store colors">{[voice.ink, voice.canvas, voice.accent].map((color) => <i key={color} style={{ background: color }} />)}</div></header>
        <div className={styles.traits}>{voice.traits.map((trait, index) => <label key={index} style={{ "--trait-index": index } as CSSProperties}>Trait {index + 1}<span><input value={trait} onChange={(event) => onChange({ ...voice, traits: voice.traits.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} /><button type="button" aria-label={`Remove ${trait || `trait ${index + 1}`}`} onClick={() => onChange({ ...voice, traits: voice.traits.filter((_, itemIndex) => itemIndex !== index) })}>×</button></span></label>)}</div>
        <blockquote><small>Reply specimen</small><p>{voice.greeting} the courier tried to deliver your parcel this morning and will try again tomorrow. You don’t need to do anything right now.</p><footer>WISMO · based on guided order facts</footer></blockquote>
        <div className={styles.voiceFields}><label>Opening<input value={voice.greeting} onChange={(event) => onChange({ ...voice, greeting: event.target.value })} /></label><label>Response guidance<textarea value={voice.guidance} onChange={(event) => onChange({ ...voice, guidance: event.target.value })} /></label></div>
      </div>
      <button className={styles.primary} onClick={onDone} disabled={!voice.greeting.trim() || !voice.guidance.trim() || voice.traits.every((trait) => !trait.trim())}>Use this voice <span aria-hidden="true">→</span></button>
    </section>
  );
}

function ProofStep({ email, status, onStart, onEvent, onError }: { email: string; status: TestStatus; onStart: () => void; onEvent: (status: TestStatus) => void; onError: () => void }) {
  async function run() {
    onStart();
    try { await runTestOrder(onEvent); }
    catch { onError(); }
  }

  const stages = [
    { name: "Customer question", text: `Received in ${email}` },
    { name: "Shopify identity", text: "#TEST-4921 · Amina M. matched" },
    { name: "Courier evidence", text: "Delivery attempted · 11:00" },
    { name: "WISMO judgment", text: "Reply prepared for review" },
  ];
  const rank: Record<TestStatus, number> = { idle: -1, sending: -1, received: 0, checking: 2, prepared: 3, error: -1 };
  const currentRank = rank[status];

  return (
    <section className={`${styles.step} ${styles.proofStep}`}>
      <StepHeader number="04" eyebrow="Proof" title="Watch the agent investigate." text="One seeded case shows exactly what WISMO checks, rejects, and prepares before you choose its control level." />
      <div className={styles.caseFile}><header><div><small>Proof case</small><strong>#TEST-4921</strong></div><GuideBadge /></header><p>Amina asked where her order is after a delivery attempt.</p></div>
      <ol className={styles.trace}>{stages.map((stage, index) => <li key={stage.name} data-done={currentRank >= index} data-active={status !== "idle" && currentRank + 1 === index}><span>{currentRank >= index ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>{stage.name}</strong><small>{stage.text}</small></div><em>{currentRank >= index ? "Verified" : "Waiting"}</em></li>)}</ol>
      <p className={styles.srOnly} aria-live="polite">Proof status: {status}</p>
      <button className={styles.primary} disabled={status !== "idle" && status !== "error"} onClick={run}>{status === "idle" || status === "error" ? "Run the proof case" : "WISMO is investigating…"}<span aria-hidden="true">→</span></button>
    </section>
  );
}

type ControlStepProps = {
  state: { active: boolean; email: string; shopDomain: string; voice: VoiceProfile | null; autonomyMode: AutonomyMode };
  onModeChange: (mode: AutonomyMode) => void;
  onActivate: () => void;
  onEdit: () => void;
};

function ControlStep({ state, onModeChange, onActivate, onEdit }: ControlStepProps) {
  const [confirmed, setConfirmed] = useState(false);
  const selected = autonomyModeContent(state.autonomyMode);

  if (state.active) {
    return (
      <section className={`${styles.step} ${styles.receipt}`}>
        <div className={styles.receiptStamp}>Briefed<br />and ready</div>
        <StepHeader number="05" eyebrow="Control saved" title="Your agent knows the boundary." text="The evidence, voice, and control level are saved on this device. Nothing external changed in this guided setup." />
        <dl><div><dt>Inbox</dt><dd>{state.email}</dd></div><div><dt>Store</dt><dd>{state.shopDomain}</dd></div><div><dt>Voice</dt><dd>{state.voice?.storeName}</dd></div><div><dt>Control</dt><dd>{selected.label}</dd></div></dl>
        <div className={styles.receiptActions}><Link className={styles.primary} href="/inbox">Open the evidence desk <span aria-hidden="true">→</span></Link><button className={styles.textButton} type="button" onClick={onEdit}>Change control level</button></div>
      </section>
    );
  }

  return (
    <section className={`${styles.step} ${styles.controlStep}`}>
      <StepHeader number="05" eyebrow="Control" title="Decide when WISMO acts." text="Choose a starting control level. The agent keeps the same evidence rules in every mode." />
      <fieldset className={styles.modeChoices}>
        <legend>Starting control level</legend>
        {autonomyModes.map((mode) => <label key={mode.id} data-selected={state.autonomyMode === mode.id}><input type="radio" name="autonomy-mode" value={mode.id} checked={state.autonomyMode === mode.id} onChange={() => { setConfirmed(false); onModeChange(mode.id); }} /><span><strong>{mode.label}{mode.recommended ? <em>Recommended</em> : null}</strong><small>{mode.description}</small></span></label>)}
      </fieldset>
      <div className={styles.controlSummary} aria-live="polite"><p><span>WISMO may</span><strong>{selected.alone}</strong></p><p><span>Human control</span><strong>{selected.approval}</strong></p><small>You can change this later in Agent settings.</small></div>
      <div className={styles.exclusions}><small>Always outside this agent’s scope</small><span>Address changes</span><span>Refunds</span><span>Delivery conflicts</span></div>
      <label className={styles.confirmation}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><strong>I understand this control level</strong><small>This guided setup saves the preference locally and does not connect or send anything.</small></span></label>
      <button className={styles.primary} disabled={!confirmed} onClick={onActivate}>Save control level <span aria-hidden="true">→</span></button>
    </section>
  );
}
