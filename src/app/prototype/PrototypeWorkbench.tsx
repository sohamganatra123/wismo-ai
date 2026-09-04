"use client";

import Link from "next/link";
import { startTransition, useRef, useState } from "react";
import { parseOrdersCsv, sampleOrdersCsv, type OrderRecord } from "@/prototype/orders";
import { decideEmail, type EmailInput, type WorkflowDecision } from "@/prototype/workflow";
import styles from "./prototype.module.css";

type RunState = "idle" | "running" | "complete";
type TraceStep = { label: string; detail: string; state: "done" | "active" | "waiting" };

const scenarios: Array<{ label: string; input: EmailInput }> = [
  {
    label: "Clear request",
    input: { from: "amina@example.com", subject: "Where is order #4921?", body: "Hi, can you tell me when my package will arrive?" },
  },
  {
    label: "Needs clarity",
    input: { from: "leo@example.com", subject: "Delivery question", body: "Where is my package?" },
  },
  {
    label: "Not relevant",
    input: { from: "amina@example.com", subject: "Invoice copy", body: "Could you send last month's invoice again?" },
  },
];

const initialParsed = parseOrdersCsv(sampleOrdersCsv());
const initialOrders = initialParsed.ok ? initialParsed.orders : [];

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function decisionLabel(decision: WorkflowDecision) {
  if (decision.kind === "ignore") return "Stayed quiet";
  if (decision.kind === "clarify") return "Asked for clarity";
  return "Response prepared";
}

export default function PrototypeWorkbench() {
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [fileName, setFileName] = useState("sample-orders.csv");
  const [csvError, setCsvError] = useState("");
  const [email, setEmail] = useState<EmailInput>(scenarios[0].input);
  const [runState, setRunState] = useState<RunState>("idle");
  const [decision, setDecision] = useState<WorkflowDecision | null>(null);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const runId = useRef(0);

  async function loadFile(file: File | undefined) {
    if (!file) return;
    const result = parseOrdersCsv(await file.text());
    if (!result.ok) {
      setCsvError(result.errors.join(" "));
      return;
    }
    setOrders(result.orders);
    setFileName(file.name);
    setCsvError("");
    setDecision(null);
    setTrace([]);
    setRunState("idle");
  }

  function chooseScenario(input: EmailInput) {
    startTransition(() => {
      setEmail(input);
      setDecision(null);
      setTrace([]);
      setRunState("idle");
    });
  }

  async function runAgent() {
    const currentRun = runId.current + 1;
    runId.current = currentRun;
    setRunState("running");
    setDecision(null);
    const nextDecision = decideEmail(email, orders);
    const steps: TraceStep[] = [
      { label: "Read email", detail: `${email.from} · ${email.subject || "No subject"}`, state: "active" },
      { label: "Check relevance", detail: "Waiting", state: "waiting" },
      { label: "Match order", detail: "Waiting", state: "waiting" },
      { label: "Choose action", detail: "Waiting", state: "waiting" },
    ];
    setTrace(steps);
    await wait(360);
    if (runId.current !== currentRun) return;
    setTrace((current) => current.map((step, index) => index === 0 ? { ...step, state: "done" } : index === 1 ? { ...step, detail: nextDecision.kind === "ignore" ? "Not relevant" : "Delivery request", state: "active" } : step));
    await wait(360);
    if (runId.current !== currentRun) return;
    setTrace((current) => current.map((step, index) => index === 1 ? { ...step, state: "done" } : index === 2 ? { ...step, detail: nextDecision.kind === "respond" ? `Order #${nextDecision.order.orderId}` : nextDecision.kind === "ignore" ? "Skipped" : "No single safe match", state: "active" } : step));
    await wait(360);
    if (runId.current !== currentRun) return;
    setTrace((current) => current.map((step, index) => index === 2 ? { ...step, state: "done" } : index === 3 ? { ...step, detail: decisionLabel(nextDecision), state: "active" } : step));
    await wait(300);
    if (runId.current !== currentRun) return;
    setTrace((current) => current.map((step) => ({ ...step, state: "done" })));
    setDecision(nextDecision);
    setRunState("complete");
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}><i />WISMO</Link>
        <div><span className={styles.liveDot} />Working prototype</div>
        <Link href="/" className={styles.back}>Back to website</Link>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>Gmail + orders.csv</p>
        <h1>Put one email<br />through the agent.</h1>
        <p>Test the exact MVP rule: answer a clear delivery question, ask when it is unclear, and stay quiet when it is unrelated.</p>
      </section>

      <section className={styles.sourceBar} aria-labelledby="source-title">
        <div>
          <span className={styles.sourceIndex}>01</span>
          <div><p className={styles.eyebrow}>Order source</p><h2 id="source-title">{orders.length} orders ready</h2></div>
        </div>
        <div className={styles.sourceMeta}><span>{fileName}</span><small>Snapshot loaded now · prototype data</small></div>
        <label className={styles.fileButton}>Replace CSV<input type="file" accept=".csv,text/csv" onChange={(event) => void loadFile(event.target.files?.[0])} /></label>
      </section>
      {csvError ? <p className={styles.error} role="alert">{csvError}</p> : null}

      <section className={styles.workbench}>
        <div className={styles.compose}>
          <div className={styles.sectionHead}><span>02</span><div><p className={styles.eyebrow}>Incoming email</p><h2>What did the customer send?</h2></div></div>
          <div className={styles.scenarios} aria-label="Example emails">
            {scenarios.map((scenario) => <button key={scenario.label} type="button" onClick={() => chooseScenario(scenario.input)}>{scenario.label}</button>)}
          </div>
          <label>From<input type="email" value={email.from} onChange={(event) => setEmail((current) => ({ ...current, from: event.target.value }))} /></label>
          <label>Subject<input value={email.subject} onChange={(event) => setEmail((current) => ({ ...current, subject: event.target.value }))} /></label>
          <label>Message<textarea rows={6} value={email.body} onChange={(event) => setEmail((current) => ({ ...current, body: event.target.value }))} /></label>
          <button className={styles.runButton} type="button" onClick={() => void runAgent()} disabled={runState === "running" || !email.from.trim()}>
            {runState === "running" ? "Agent is checking…" : "Run this email"}<span>→</span>
          </button>
        </div>

        <div className={styles.ledger} aria-live="polite">
          <div className={styles.sectionHead}><span>03</span><div><p className={styles.eyebrow}>Decision ledger</p><h2>What the agent did</h2></div></div>
          {trace.length ? (
            <ol className={styles.trace}>
              {trace.map((step, index) => <li key={step.label} data-state={step.state}><span>{step.state === "done" ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div><em>{step.state}</em></li>)}
            </ol>
          ) : <div className={styles.empty}><span>W</span><p>Run an email to see each decision and the evidence behind it.</p></div>}

          {decision ? (
            <article className={styles.result} data-kind={decision.kind}>
              <p className={styles.eyebrow}>Result · {decisionLabel(decision)}</p>
              <h3>{decision.kind === "ignore" ? "No reply sent." : decision.kind === "clarify" ? "One question prepared." : `Order #${decision.order.orderId} matched.`}</h3>
              <p className={styles.reason}>{decision.reason}</p>
              {decision.kind !== "ignore" ? <pre>{decision.response}</pre> : <p className={styles.quiet}>The message stays in Gmail. No case, draft, or customer reply is created.</p>}
            </article>
          ) : null}
        </div>
      </section>

      <section className={styles.orders} aria-labelledby="orders-title">
        <div className={styles.sectionHead}><span>04</span><div><p className={styles.eyebrow}>Loaded evidence</p><h2 id="orders-title">Current CSV snapshot</h2></div></div>
        <div className={styles.tableWrap}><table><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Tracking</th><th>Updated</th></tr></thead><tbody>{orders.map((order) => <tr key={order.orderId}><td>#{order.orderId}</td><td><strong>{order.customerName}</strong><small>{order.customerEmail}</small></td><td>{order.status}</td><td>{order.trackingNumber ?? "—"}</td><td>{new Date(order.statusUpdatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td></tr>)}</tbody></table></div>
      </section>
    </main>
  );
}
