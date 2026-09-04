"use client";

import { makeFunctionReference } from "convex/server";
import { useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import styles from "./page.module.css";

type Decision = "approve" | "override" | "guide";
const labels: Record<Decision, string> = { approve: "Approve recommendation", override: "Choose a different action", guide: "Add guidance and resume" };
const proposeMemoryRef = makeFunctionReference<"mutation", { caseId?: string; guidance: string }, string>("memories:proposeMemory");

export default function CaseActions() {
  const params = useParams<{ caseId: string }>();
  const proposeMemory = useMutation(proposeMemoryRef);
  const [decision, setDecision] = useState<Decision>("approve");
  const [note, setNote] = useState("");
  const [saveAsMemory, setSaveAsMemory] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState("");
  const submitting = useRef(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || complete || (decision !== "approve" && !note.trim())) return;
    submitting.current = true;
    setProcessing(true);
    setFeedback("");
    try {
      if (decision === "guide" && saveAsMemory) {
        await proposeMemory({ caseId: params.caseId, guidance: note.trim() });
      }
      window.setTimeout(() => { setProcessing(false); setComplete(true); }, 900);
    } catch (reason) {
      submitting.current = false;
      setProcessing(false);
      setFeedback(reason instanceof Error ? reason.message : "Guidance could not be recorded");
    }
  }

  if (complete) return <section className={styles.receipt} aria-live="polite"><span>✓</span><div><strong>Decision recorded.</strong><p>{decision === "guide" && saveAsMemory ? "Founder review is now required before this guidance becomes reusable memory." : "No customer or courier message was sent."}</p></div></section>;

  return <form className={styles.actions} onSubmit={submit} aria-busy={processing}>
    <header><p className={styles.eyebrow}>Manager decision</p><h2>What should WISMO do next?</h2><span>Sample interaction · nothing will be sent</span></header>
    <fieldset disabled={processing}>
      <legend className={styles.srOnly}>Choose a decision</legend>
      {(["approve", "override", "guide"] as Decision[]).map((option) => <label key={option} data-selected={decision === option}><input type="radio" name="decision" value={option} checked={decision === option} onChange={() => { setDecision(option); setNote(""); setSaveAsMemory(false); setFeedback(""); }} /><span><strong>{labels[option]}</strong><small>{option === "approve" ? "Contact Northline using the prepared question." : option === "override" ? "Tell WISMO which safe action to take instead." : "Give context, then return the case to investigation."}</small></span></label>)}
    </fieldset>
    {decision !== "approve" ? <label className={styles.note}>{decision === "override" ? "Different action" : "Guidance"}<textarea required disabled={processing} value={note} onChange={(event) => setNote(event.target.value)} placeholder={decision === "override" ? "Escalate this case to the support lead…" : "Check whether yesterday’s address confirmation changed the delivery plan…"} /></label> : null}
    {decision === "guide" ? <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}><input type="checkbox" checked={saveAsMemory} disabled={processing} onChange={(event) => setSaveAsMemory(event.target.checked)} /><span><strong>Send this guidance for founder review</strong><small style={{ display: "block", opacity: 0.75 }}>Approved guidance becomes reusable memory for future recommendations.</small></span></label> : null}
    <button disabled={processing || (decision !== "approve" && !note.trim())}>{processing ? "Recording decision…" : labels[decision]} <span>→</span></button>
    {feedback ? <p role="alert">{feedback}</p> : null}
  </form>;
}
