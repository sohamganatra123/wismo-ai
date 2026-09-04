# Agentic Onboarding and Core Runtime

## Outcome

WISMO onboarding must prove the product, not describe it. A founder connects Gmail and Shopify, gives the agent a narrow operating policy, and watches it inspect a real Shopify order, reason over the evidence, and create a real unsent Gmail draft. The founder then chooses whether live cases stop at a draft or may resolve only when deterministic safety checks pass.

`/connect` remains the public early-access form. `/setup` becomes the private product activation journey.

## Correction to the earlier plan

The earlier repair plan reduced onboarding to connection checks because several promises in the simulated journey were not implemented. That would make the flow honest, but it would also hide the product's core value. The right fix is to build the missing agent capabilities first, then make onboarding exercise those capabilities.

Agentic does not mean the model receives unrestricted access. The model decides which bounded tool it needs and proposes the next action. Application code validates identity, order, tracking, policy, and idempotency before any external effect.

## Capability audit

### Already real

- Gmail OAuth and one-minute inbox polling.
- Deterministic WISMO/clarification/unrelated classification.
- Exact Shopify customer matching by sender email.
- Shopify order snapshots and matching tracking selection.
- Previous-message and tracking evidence collection.
- Approval records with duplicate-action protection.
- Approved Gmail identity and customer-update sending.
- Approved Shopify order-note execution.
- Persistent cases, messages, approvals, investigations, events, escalation fields, and memories.

### Partly built

- A new WISMO case schedules Shopify matching, but a manager must still press `Run investigation`.
- Courier attempts and retries are persisted, but the first courier message and replies are simulated.
- The UI shows an audit trail, but the static case page still uses sample data and the live view exposes only parts of the trace.
- An `AgentService` contract exists, but no model implementation calls it.

### Missing core capability

- A model-driven decision step with strict tool schemas.
- A durable agent run that resumes across actions, retries, and restarts.
- Automatic progression from intake to evidence gathering and action proposal.
- Real courier email sending and inbound reply matching.
- A persisted workspace autonomy policy.
- Deterministic permission gates for verified automatic actions.
- A real onboarding proof run.

## Product boundary

The model may:

- classify intent and ambiguity;
- choose from a small set of read or proposal tools;
- explain its evidence and recommendation;
- draft customer and courier messages;
- request escalation.

The model may not directly:

- send email;
- write Shopify data;
- choose its own autonomy level;
- bypass exact identity or tracking checks;
- retry indefinitely;
- correct a previous message without approval.

Those effects are controlled by deterministic code. “Deterministic” means the same checked facts always produce the same permission result; a model cannot talk its way around it.

## Workspace control levels

### Investigate only

The agent reads Gmail and Shopify, gathers evidence, and recommends the next step. It creates no external draft or action.

The onboarding proof is the only exception: clicking `Run proof` explicitly authorizes one unsent, founder-addressed Gmail draft. That setup-only draft does not change the live policy.

### Draft for approval — recommended

The agent investigates and prepares customer or courier actions. A manager approves every send and Shopify write.

### Resolve verified cases

The agent may send a routine customer tracking update without approval only when all of these are true:

- sender email exactly matches the Shopify customer;
- exactly one active order is in scope or the customer selected one;
- the selected order owns the tracking number;
- the newest scan is unambiguous and newer than the stored order snapshot;
- Shopify and courier facts do not conflict;
- the action is not a correction, refund, address change, delivery change, or financial action;
- no prior action key has executed;
- the workspace completed a successful onboarding proof run.

Courier email may be sent automatically only to an active founder-configured courier contact and only with the order number and tracking number needed for the inquiry. Shopify tracking changes and corrections always require approval in the first release.

## Agent runtime

Use the OpenAI Responses API function-calling loop with strict JSON schemas. Keep the initial tool set small:

1. `read_case_context`
2. `match_shopify_customer`
3. `select_only_order`
4. `collect_order_evidence`
5. `prepare_customer_update`
6. `prepare_identity_request`
7. `prepare_courier_request`
8. `escalate_case`

The runtime records each model response, requested tool, validated arguments, tool result, token usage, failure, and final recommendation. It permits at most eight tool rounds per run. Repeated or invalid tool calls stop safely and escalate.

Follow the official OpenAI function-calling sequence: send tools, receive calls, execute application code, return each tool output using its call ID, then continue until the model finishes. Preserve reasoning items returned with tool calls for the next request. Reference: [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling).

## Agentic onboarding journey

### 01 · Brief

The founder sees the fixed mission: resolve delivery-status questions. They choose a starting control level and review the actions that remain blocked. The selected policy is saved to the workspace, not local storage.

### 02 · Sources

Connect the real shared Gmail inbox, then the real Shopify store. Each successful connection triggers an automatic capability check. The agent reports what it could read, which permissions it has, and what is still missing.

### 03 · Learn

The agent inspects operational structure rather than pretending to learn a brand voice. A stored capability inspection reads the granted Gmail scopes, Shopify access scopes, a small set of recent fulfilled orders, available carriers, tracking-number coverage, and configured courier contacts. It proposes a setup brief:

- available evidence;
- missing courier contact or rule;
- actions allowed by the selected control level;
- cases that must escalate.

The founder can correct the proposed brief. Corrections are stored as workspace rules; they do not silently become model memory. Gmail draft creation is first tested in Proof so Learn does not leave an unexplained draft.

### 04 · Proof

The founder selects one recent fulfilled Shopify order. WISMO starts a real dry run:

1. reads the selected order and fulfillment;
2. verifies the Shopify-owned tracking number and current Shopify fulfillment state;
3. asks the model for the next safe action through strict tools;
4. generates a customer update;
5. creates a real unsent Gmail draft titled `[WISMO PROOF — NOT SENT]` addressed to the founder's connected Gmail address;
6. records every step in the agent timeline.

The proof does not create a customer case, send a message, or change Shopify. It uses a proof-specific runtime context rather than calling case-only mutations. It succeeds only when deterministic code confirms stored steps for order re-read, tracking ownership, draft preparation, Gmail draft creation, and run completion.

Proof draft creation uses a stable proof action key and Message-ID. A retry first reconciles Gmail drafts using that Message-ID. If Gmail may have written a draft but returned no usable response, the proof enters `needs_reconciliation` and never creates another draft blindly.

### 05 · Activate

Show the proof receipt, selected control level, automatic actions, approval-required actions, and permanent exclusions. The founder explicitly activates the policy. The final action opens the live inbox, where new WISMO email triggers the same runtime used in proof mode.

## Human, task, and feel

- **Human:** A Shopify founder granting a new worker access to real customer operations.
- **Task:** Set its boundary, connect its tools, inspect what it learned, and verify one real action before activation.
- **Feel:** Supervising a capable new operator during its first shift.

## Product world

- **Domain:** worker brief, evidence source, tool call, order record, tracking scan, approval gate, proof draft, activation receipt.
- **Color world:** receipt paper `#F7F4EA`, deep paper `#ECE5D5`, carbon `#171714`, graphite `#5B594F`, cobalt `#2457FF`, quiet rule `#D1C8B6`, error red only for failures.
- **Signature:** One live case trace grows as the agent calls each real tool. Every row names the source, result, elapsed time, and whether code or a human controls the next step.
- **Rejecting:** generic setup wizard; fake animated agent; connection-only checklist; unrestricted “AI magic.”

## Route boundaries

- `/connect` — public one-field early-access request.
- `/login` — returning workspace access.
- `/setup` — authenticated agent briefing, sources, learn, proof, and activation.
- `/settings` — founder-only connections, team, courier contacts, rules, policy, and memory review.
- `/inbox` — live work and agent traces.

V1 is intentionally a single-workspace deployment: integrations, contacts, rules, policies, and proofs belong to that one workspace. Multi-workspace tenancy must add `workspaceId` to all of them before accounts are mixed in one deployment.

## Safety and privacy

- Never include access tokens, refresh tokens, raw credentials, or unrelated customer data in a model request, event, UI, or analytics payload.
- Minimize model context to the selected case or proof order.
- Redact street address and phone unless a future tool explicitly needs them.
- Store the OpenAI response ID and token counts, not hidden reasoning text.
- A proof draft is always unsent, addressed to the founder, and visibly marked as proof.
- Model or API failure stops the run and records a retryable error; it never falls through to an external action.
- External actions use stable action keys and an atomic claim before execution.

## Accessibility and interaction

- Archivo for interface text; IBM Plex Mono for tool, source, and status labels.
- Body and input text are 16px; helper and status text are at least 12px.
- Controls are at least 44px high with visible labels and focus rings.
- Agent progress is announced through a live region and remains readable without motion.
- Tool rows use text plus state, never color alone.
- At 200% zoom and 390px width, the trace becomes one column without horizontal scrolling.
- Motion is limited to new tool rows entering over 180–220ms; reduced motion renders them immediately.

## Acceptance checks

- A new live WISMO email automatically advances through matching and investigation without a manager pressing `Run investigation`.
- Every model-selected tool has a strict schema and an application-side permission check.
- Duplicate or resumed runs do not repeat an external action.
- A real courier request is sent through Gmail and a matched reply resumes the case.
- `Draft for approval` never sends without approval.
- `Resolve verified cases` sends only when every listed safety predicate passes.
- Shopify changes and corrections still require approval.
- Onboarding creates a real unsent Gmail proof draft from real Shopify evidence.
- The proof describes Shopify fulfillment and tracking ownership; it does not claim a live carrier scan unless a real stored courier reply supplied one.
- The onboarding timeline is backed by stored run steps, not timers.
- Activation is blocked until the proof draft succeeds.
- Public waitlist, role controls, keyboard use, 200% zoom, reduced motion, 1440×900, 768×1024, and 390×844 remain usable.
- Tests, lint, Convex code generation, and production build pass.
