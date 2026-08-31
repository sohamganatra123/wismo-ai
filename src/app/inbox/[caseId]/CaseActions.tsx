"use client";

import { useRef, useState, type FormEvent } from "react";
import styles from "./page.module.css";

type Decision = "approve" | "override" | "guide";
const labels: Record<Decision, string> = { approve: "Approve recommendation", override: "Choose a different action", guide: "Add guidance and resume" };

export default function CaseActions() {
  const [decision, setDecision] = useState<Decision>("approve");
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const submitting = useRef(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || complete || (decision !== "approve" && !note.trim())) return;
    submitting.current = true;
    setProcessing(true);
    window.setTimeout(() => { setProcessing(false); setComplete(true); }, 900);
  }

  if (complete) return <section className={styles.receipt} aria-live="polite"><span>✓</span><div><strong>Decision recorded in this sample.</strong><p>No customer or courier message was sent.</p></div></section>;

  return <form className={styles.actions} onSubmit={submit} aria-busy={processing}>
    <header><p className={styles.eyebrow}>Manager decision</p><h2>What should WISMO do next?</h2><span>Sample interaction · nothing will be sent</span></header>
    <fieldset disabled={processing}>
      <legend className={styles.srOnly}>Choose a decision</legend>
      {(["approve", "override", "guide"] as Decision[]).map((option) => <label key={option} data-selected={decision === option}><input type="radio" name="decision" value={option} checked={decision === option} onChange={() => { setDecision(option); setNote(""); }} /><span><strong>{labels[option]}</strong><small>{option === "approve" ? "Contact Northline using the prepared question." : option === "override" ? "Tell WISMO which safe action to take instead." : "Give context, then return the case to investigation."}</small></span></label>)}
    </fieldset>
    {decision !== "approve" ? <label className={styles.note}>{decision === "override" ? "Different action" : "Guidance"}<textarea required disabled={processing} value={note} onChange={(event) => setNote(event.target.value)} placeholder={decision === "override" ? "Escalate this case to the support lead…" : "Check whether yesterday’s address confirmation changed the delivery plan…"} /></label> : null}
    <button disabled={processing || (decision !== "approve" && !note.trim())}>{processing ? "Recording decision…" : labels[decision]} <span>→</span></button>
  </form>;
}
