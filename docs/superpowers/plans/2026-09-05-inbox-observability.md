# Inbox Case Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe, live activity trace to each selected inbox case so a founder can understand the agent's work and failures while deciding how to reply.

**Architecture:** Add a server-side projection that joins existing case events, agent runs, agent steps, approvals, and message delivery records into a small allowlisted view model. Load that model on demand in a case-level disclosure below the handoff; keep History reserved for a later resolved-case archive.

**Tech Stack:** Next.js 16, React 19, TypeScript, Convex, Vitest, CSS Modules

**Spec:** `docs/design/inbox-observability.md`

## Global Constraints

- Observability is per case; History remains a separate future archive.
- Do not return raw database documents, arbitrary JSON payloads, or hidden model reasoning.
- The reply composer remains the focal action for a human-review case.
- Activity loads only for the selected case and only after the founder opens it.
- Existing redaction and bounded-text rules remain authoritative.
- Every state must be understandable without color alone.
- `e2e-test-orders.csv` remains an untracked local test file.

---

### Task 1: Define the safe activity view model

**Files:**
- Create: `convex/domain/caseObservability.ts`
- Create: `convex/domain/caseObservability.test.ts`

**Interfaces:**
- Consumes: narrow event, run, step, approval, and message records.
- Produces: `buildCaseObservability(input): CaseObservability`.

- [ ] **Step 1: Write the failing projection test.**

```ts
import { describe, expect, it } from "vitest";
import { buildCaseObservability } from "./caseObservability";

describe("buildCaseObservability", () => {
  it("builds a chronological trace without copying raw payloads", () => {
    const result = buildCaseObservability({
      now: 1_725_466_410_000,
      runs: [{
        id: "run-1",
        status: "escalated",
        startedAt: 1_725_466_400_000,
        completedAt: 1_725_466_408_000,
        inputTokens: 420,
        outputTokens: 96,
        error: "Tracking sources conflict",
      }],
      steps: [{
        id: "step-1",
        runId: "run-1",
        sequence: 1,
        kind: "tool",
        name: "collect_order_evidence",
        status: "completed",
        startedAt: 1_725_466_401_000,
        completedAt: 1_725_466_402_500,
        safeSummary: "Found two conflicting scans",
      }],
      events: [{
        id: "event-1",
        type: "case_escalated",
        summary: "Tracking sources conflict",
        createdAt: 1_725_466_408_000,
        error: null,
      }],
      approvals: [],
      messages: [],
    });

    expect(result.summary).toEqual({
      status: "escalated",
      startedAt: 1_725_466_400_000,
      completedAt: 1_725_466_408_000,
      durationMs: 8_000,
      stepCount: 1,
      externalActionCount: 0,
      inputTokens: 420,
      outputTokens: 96,
    });
    expect(result.items.map((item) => item.title)).toEqual([
      "Collected order evidence",
      "Case sent for human review",
    ]);
    expect(JSON.stringify(result)).not.toContain("toolInput");
  });
});
```

- [ ] **Step 2: Run `npx vitest run convex/domain/caseObservability.test.ts`.** Expect failure because the module does not exist.
- [ ] **Step 3: Define the output contract.**

```ts
export type ActivityState =
  | "running"
  | "success"
  | "waiting"
  | "blocked"
  | "failed"
  | "info";

export type CaseActivityItem = {
  id: string;
  occurredAt: number;
  durationMs: number | null;
  category: "message" | "agent" | "tool" | "approval" | "external" | "system";
  state: ActivityState;
  title: string;
  detail: string | null;
  facts: Array<{ label: string; value: string }>;
  sourceId: string;
};

export type CaseObservability = {
  summary: {
    status: "idle" | "queued" | "running" | "waiting" | "completed" | "failed" | "escalated";
    startedAt: number | null;
    completedAt: number | null;
    durationMs: number | null;
    stepCount: number;
    externalActionCount: number;
    inputTokens: number;
    outputTokens: number;
  };
  items: CaseActivityItem[];
};
```

- [ ] **Step 4: Implement allowlisted labels and states.** Map known tool names to plain labels such as `collect_order_evidence → Collected order evidence`; map `case_escalated → Case sent for human review`; map approval and message delivery states without including their raw payloads. Unknown event types become **System event** with the already-bounded event summary.
- [ ] **Step 5: Add tests for privacy and ordering.** Pass objects containing extra `payload`, `input`, `output`, `toolInput`, and `toolResult` fields through the projection and assert none appear in the serialized result. Cover a running step with duration measured to `now`, failed approval, sent message, no-run idle case, and equal timestamps ordered by stable source ID.
- [ ] **Step 6: Run the focused test.** Expect PASS.
- [ ] **Step 7: Commit.**

```bash
git add convex/domain/caseObservability.ts convex/domain/caseObservability.test.ts
git commit -m "test: define safe case observability model"
```

### Task 2: Add an authenticated case-observability query

**Files:**
- Create: `convex/caseObservability.ts`
- Modify: `convex/_generated/api.d.ts`

**Interfaces:**
- Consumes: `buildCaseObservability` from Task 1 and a selected `caseId`.
- Produces: `caseObservability:getForCase({ caseId }): CaseObservability | null`.

- [ ] **Step 1: Create the authenticated query.** Require `getAuthUserId`, require a matching `profiles` row, and return `null` when the case does not exist. Load case runs, case events, case approvals, and case messages in parallel.
- [ ] **Step 2: Load agent steps by run.** For every case run, query `agentSteps.by_run`, flatten the results, and pass only these fields to the projection: ID, run ID, sequence, kind, name, status, timestamps, bounded error, and a safe summary extracted from validated output.
- [ ] **Step 3: Allowlist safe summaries.** For tool steps, read only `output.result.summary`, `output.result.status`, and the already-declared safe evidence fields from `safeAgentToolResult`. For model steps, return no body text; expose only status, duration, call count, and token counts from the run. For policy steps, expose decision and status, never the raw input.
- [ ] **Step 4: Project external actions once.** Treat delivered outbound messages and approval execution as one external action by matching the approval action key/provider result where available. If they cannot be matched, prefer the delivered message and omit the duplicate completed-approval row.
- [ ] **Step 5: Run `npx convex codegen`.** Expect `convex/_generated/api.d.ts` to include `caseObservability` with no TypeScript error.
- [ ] **Step 6: Run `npx tsc --noEmit` and the focused domain test.** Expect PASS.
- [ ] **Step 7: Commit.**

```bash
git add convex/caseObservability.ts convex/_generated/api.d.ts
git commit -m "feat: query safe case activity"
```

### Task 3: Add the on-demand activity trace to the inbox

**Files:**
- Create: `src/app/inbox/CaseObservability.tsx`
- Create: `src/app/inbox/observabilityPresentation.ts`
- Create: `src/app/inbox/observabilityPresentation.test.ts`
- Modify: `src/app/inbox/LiveCases.tsx:536`
- Modify: `src/app/inbox/page.module.css:453`

**Interfaces:**
- Consumes: selected case ID and `caseObservability:getForCase`.
- Produces: a collapsed run summary and an expandable chronological activity trace.

- [ ] **Step 1: Write failing presentation tests.**

```ts
import { describe, expect, it } from "vitest";
import { formatDuration, observabilitySummary } from "./observabilityPresentation";

describe("observability presentation", () => {
  it("formats useful short durations", () => {
    expect(formatDuration(850)).toBe("850 ms");
    expect(formatDuration(8_400)).toBe("8.4 s");
    expect(formatDuration(125_000)).toBe("2m 5s");
  });

  it("describes escalation without relying on color", () => {
    expect(observabilitySummary({
      status: "escalated",
      stepCount: 7,
      durationMs: 8_400,
    })).toBe("Human review · 7 steps · 8.4 s");
  });
});
```

- [ ] **Step 2: Run `npx vitest run src/app/inbox/observabilityPresentation.test.ts`.** Expect failure because the helper does not exist.
- [ ] **Step 3: Implement duration and summary formatting.** Use tabular numeric output and exact labels for idle, queued, running, waiting, completed, failed, and escalated. Singularize one step; use an em dash when duration is unavailable.
- [ ] **Step 4: Build `CaseObservability` with native disclosure behavior.** Render a `<details>` with `<summary>` reading **How WISMO handled this** plus `observabilitySummary`. Mount an inner `CaseActivityData` component only while open so `useQuery` does not subscribe before the founder asks for detail.
- [ ] **Step 5: Render complete data states.** Loading says **Loading case activity…**; query `null` says **Case activity is unavailable**; an empty result says **No agent activity has been recorded yet**; a running trace uses `aria-live="polite"`; failures include visible **Failed** text and their bounded error detail.
- [ ] **Step 6: Render one causal timeline.** Sort oldest to newest from the server. Each row shows state text, title, detail, time, optional duration, and allowlisted facts. Put `sourceId` inside a nested native `<details>` labeled **Technical ID**, not in the main row.
- [ ] **Step 7: Place it below `AgentHandoff` and above lower evidence.** Do not put it above the conversation or between the composer label and textarea. The disclosure summary stays visually quieter than `Send reply and resolve`.
- [ ] **Step 8: Style the evidence line.** Use the existing receipt paper, carbon, cobalt, muted-red, mono metadata, square edges, and 8px spacing system. Use a single 1px vertical line with state markers; avoid cards per event. Add visible hover, focus, open, loading, empty, failed, and reduced-motion states.
- [ ] **Step 9: Add mobile behavior.** At 375px, stack time and duration below the title, wrap facts, keep the summary at least 44px tall, and prevent source IDs from widening the viewport.
- [ ] **Step 10: Run the focused test and TypeScript.** Expect PASS.
- [ ] **Step 11: Commit.**

```bash
git add src/app/inbox/CaseObservability.tsx src/app/inbox/observabilityPresentation.ts src/app/inbox/observabilityPresentation.test.ts src/app/inbox/LiveCases.tsx src/app/inbox/page.module.css
git commit -m "feat: show live case activity in inbox"
```

### Task 4: Verify observability against real case paths

**Files:**
- Modify only a named file above when a check exposes a defect in that file.

**Interfaces:**
- Consumes: the server projection and inbox activity disclosure.
- Produces: a verified observability layer with no raw-data leak and no History behavior change.

- [ ] **Step 1: Run all automated checks.**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all tests pass, lint and TypeScript print no errors, and the production build succeeds.

- [ ] **Step 2: Inspect the browser query response.** Open a case with agent activity and confirm the response contains only `summary` and documented activity-item fields. Search the response for `payload`, `toolInput`, `toolResult`, raw model `input`, and raw model `output`; none may be present.
- [ ] **Step 3: Verify a normal clarification path.** Confirm the trace shows intake, classification/evidence activity, and one successful external send. The exact email body appears only in Conversation.
- [ ] **Step 4: Verify an escalation path.** Confirm the trace names the stop reason and failed or blocked step, while the handoff still owns the recommendation and the composer remains the focal action.
- [ ] **Step 5: Verify live progress.** Open the disclosure on a running case and confirm steps update without refreshing. Close it and confirm the detail query unsubscribes.
- [ ] **Step 6: Verify access and navigation.** A signed-out request returns no trace. Founder and support-agent profiles with inbox access can read it. History remains disabled and no History route is implied.
- [ ] **Step 7: Review at 1440×900 and 375×812.** Confirm the closed summary, open trace, long error, long technical ID, keyboard focus, and running state fit without horizontal scrolling or hiding the reply action.
- [ ] **Step 8: Commit verification fixes.** Stage only the exact files changed to resolve failed checks and use commit message `fix: verify inbox case observability`.

## Self-review

- Spec coverage: per-case placement, History separation, summary metrics, causal trace, live updates, safe allowlisting, no hidden reasoning, data states, access, and responsive behavior each map to a task.
- Placeholder scan: no deferred implementation markers or unspecified error-handling steps remain.
- Type consistency: `CaseObservability`, `CaseActivityItem`, `ActivityState`, `buildCaseObservability`, and `getForCase` use the same names across domain, query, client, and tests.
