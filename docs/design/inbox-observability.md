# Inbox Case Observability

## Goal

Let a founder understand what WISMO did, what evidence it used, where it stopped, and whether an external action succeeded—without leaving the live inbox or reading raw system logs.

## Implementation choice

V1 uses a custom Convex projection rather than an external vendor. The product already persists agent runs, steps, events, approvals, and sent messages, so `observability:getCaseObservability` exposes a bounded, authenticated activity trace without exporting customer content or requiring another service. Opik or Langfuse can be added later as an external sink without changing the inbox contract.

## Current-code findings

- The Inbox navigation renders **History** as `aria-disabled="true"`; there is no History route or interactive tab.
- `convex/caseTimeline.ts` already reads case events, approvals, messages, memories, and owner information, but no client calls it.
- The separate `/inbox/[caseId]` page is driven by static `caseData`. Its own audit hint says the sample should be replaced by a Convex case-events query.
- Durable observability records already exist in `events`, `agentRuns`, `agentSteps`, `approvals`, and `messages`. They are stored in different shapes and are not projected into one safe timeline.
- Agent-step persistence validates and redacts stored tool data. The UI must keep using a small allowlist and must not expose hidden model reasoning or dump arbitrary JSON.

## History and observability are different

- **History** answers: “Which conversations are finished, and what was their outcome?” It should eventually be a searchable archive of closed cases.
- **Observability** answers: “What happened inside this case, in what order, and why does it need me now?” It belongs inside the selected live case.

History may later link to the same read-only case activity, but it should not become a system-log destination.

## Product model

The observability layer has two levels:

1. **Run summary:** current result, elapsed time, number of steps, external actions, and the final stop or success state.
2. **Activity trace:** a chronological, human-readable sequence of intake, evidence checks, agent/tool steps, approval decisions, sends, failures, and escalation.

Each activity item contains:

- A plain-language title.
- A timestamp and, when possible, duration.
- A category: message, agent, tool, approval, external action, or system.
- A state: running, success, waiting, blocked, failed, or informational.
- A short safe detail and a small allowlisted set of facts.
- A stable source ID for support debugging, hidden behind a disclosure.

## Review experience

The founder's main task remains replying safely. The activity trace sits below the agent handoff in a native disclosure labeled **How WISMO handled this**. Its closed summary shows the current run state, step count, and elapsed time. Opening it reveals a single cobalt evidence line with events in causal order.

The trace does not use dashboard charts, fake health scores, decorative colored badges, or raw log tables. Cobalt marks active or verified WISMO work, muted red marks a real failure or escalation, and neutral receipt-paper rows carry routine events.

## Data and privacy rules

- Build the trace on the server from the selected case's `events`, `agentRuns`, `agentSteps`, `approvals`, and `messages`.
- Return a purpose-built view model; do not return raw database documents or arbitrary `input`, `output`, `payload`, `toolInput`, or `toolResult` objects.
- Permit only existing safe fields such as order name, fulfillment status, tracking status, action kind, delivery state, step status, token counts, and error text already bounded by persistence rules.
- Never expose chain-of-thought or hidden reasoning. A model step may say **WISMO evaluated the evidence** and show duration/token counts; its customer-facing final text belongs in the handoff or draft surface.
- Require an authenticated WISMO profile for the query, matching current inbox access.
- Load trace details only for the selected case and only when the disclosure is open.
- Convex live queries should update a running trace without manual refresh.

## Acceptance checks

- The History navigation item remains disabled and is not presented as observability.
- A live case shows a collapsed **How WISMO handled this** summary without competing with the reply composer.
- Expanding it shows real records in chronological order, with durations and states where available.
- A failed or escalated case identifies the failed step or stop reason.
- A sent clarification or founder reply shows one external-send activity with delivery state, while the exact body stays in the conversation.
- Approval activity distinguishes proposed, executing, completed, rejected, and failed.
- No raw database payload or hidden model reasoning appears in the browser response.
- Empty, loading, live-running, error, and complete states are understandable without color alone.
- The trace is keyboard usable and readable at 375px without horizontal scrolling.

## Future History scope

A separate History feature may add `/inbox/history` with search, filters, outcome, resolver, and resolved date. Selecting a historical row may reuse the read-only conversation, handoff, and activity components built here.
