# MVP V2 Gmail-First Autonomous Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Gmail-first WISMO workflow that reads order status from a validated `orders.csv` snapshot, responds safely, asks one clarification when needed, and remains silent on unrelated mail.

**Architecture:** Start every WISMO case directly from Gmail and match it through an `OrderSource` interface backed by an atomically imported CSV snapshot. Keep Shopify out of the MVP path; a later connector can implement the same interface. Route every external effect through one atomic executor, and unlock verified sends only after a persisted CSV-plus-Gmail proof.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Convex, OpenAI Responses API, Gmail API, Vitest

**Spec:** `docs/design/mvp-v2-gmail-first.md`

## Global Constraints

- Preserve all existing uncommitted work; do not rewrite unrelated landing-page or visual changes.
- Gmail and a valid `orders.csv` snapshot are required for status answers.
- Shopify must not be called by the MVP workflow.
- CSV rows older than 24 hours cannot support automatic sending.
- The model never sends email or changes policy directly.
- Stable action keys and an atomic database claim protect every external effect.
- Automatic customer text is deterministic and built from stored evidence.
- Corrections and unsupported actions never execute automatically.
- Do not claim completion without a real Gmail sandbox smoke test.

---

### Task 1: CSV Order Source And Atomic Import

**Files:**
- Create: `convex/domain/orderSource.ts`
- Create: `convex/domain/csvOrders.ts`
- Test: `convex/domain/csvOrders.test.ts`
- Create: `convex/orderImports.ts`
- Modify: `convex/schema.ts`

**Interfaces:**
- Produces: `OrderSource.findOrders({ email, orderReference }): Promise<OrderSnapshot[]>`.
- Produces: `parseOrdersCsv(text): CsvImportResult` and `importCsv({ text }): { importId, rowCount }`.
- Produces: one active order snapshot replaced atomically per successful import.

- [ ] **Step 1: Write parser tests** for the exact eight-column header, quoted commas, CRLF, empty optional cells, duplicate IDs, invalid email/timestamp, extra columns, formula prefixes, 5 MB, and 10,000-row limits.
- [ ] **Step 2: Run** `npm test -- convex/domain/csvOrders.test.ts` and confirm the new tests fail.
- [ ] **Step 3: Define `OrderSnapshot` and `OrderSource`** in `orderSource.ts`; use source-neutral names and set the current implementation's source to `csv`.
- [ ] **Step 4: Implement `parseOrdersCsv`** without executing formulas or accepting partial rows. Normalize email and order references; preserve display strings as bounded text.
- [ ] **Step 5: Add `orderImports` and source-neutral `orders` fields**. Stage rows under a new import ID, validate all rows, then switch one `activeOrderImport` pointer in a single mutation.
- [ ] **Step 6: Add founder-only `importCsv`** and return row-level errors without changing the active snapshot.
- [ ] **Step 7: Run** `npm test -- convex/domain/csvOrders.test.ts && npx tsc --noEmit`.
- [ ] **Step 8: Commit** `feat: import orders from csv atomically`.

### Task 2: Gmail Intake Decision Table

**Files:**
- Create: `convex/domain/emailDecision.ts`
- Test: `convex/domain/emailDecision.test.ts`
- Modify: `convex/gmailData.ts`
- Modify: `convex/gmailPolling.ts`
- Modify: `convex/lib/agentScheduling.ts`

**Interfaces:**
- Produces: `decideInbound({ relevance, clarity }): "ignore" | "clarify" | "start_agent"`.
- Produces: one agent run for relevant, clear mail and one clarification for relevant, unclear mail.

- [ ] **Step 1: Test the three required outcomes**: unrelated is silent, relevant unclear asks once, relevant clear starts one agent run.
- [ ] **Step 2: Run** `npm test -- convex/domain/emailDecision.test.ts` and confirm failure.
- [ ] **Step 3: Implement the decision table** independently of Shopify and order matching.
- [ ] **Step 4: Schedule the agent directly from `prepareInbound`** for `start_agent`; do not schedule Shopify matching.
- [ ] **Step 5: Keep clarification deterministic and idempotent** by reusing Gmail provider ID and thread ID.
- [ ] **Step 6: Add a database-level retry test** proving duplicate delivery creates no second case, clarification, or run.
- [ ] **Step 7: Run** `npm test -- convex/domain/emailDecision.test.ts convex/agent/orchestration.integration.test.ts`.
- [ ] **Step 8: Commit** `feat: route inbound email by relevance and clarity`.

### Task 3: Source-Neutral Case Evidence

**Files:**
- Create: `convex/domain/evidence.ts`
- Test: `convex/domain/evidence.test.ts`
- Modify: `convex/schema.ts`
- Modify: `convex/agent/contracts.ts`
- Modify: `convex/agent/privacy.ts`
- Modify: `convex/agent/redaction.ts`
- Modify: `convex/agentRuns.ts`

**Interfaces:**
- Produces: `EvidenceConfidence = "unverified" | "manager_confirmed" | "csv_confirmed" | "courier_confirmed" | "connector_confirmed"`.
- Produces: `caseEvidence` rows keyed by `caseId`, `kind`, `valueHash`, and `sourceMessageId`.
- Produces: `buildAgentEvidenceContext(caseId)` with bounded, redacted facts and source labels.

- [ ] **Step 1: Test evidence promotion rules**: customer text stays unverified; an exact active CSV row becomes CSV-confirmed; a matched courier reply becomes courier-confirmed; conflicting values remain separate.
- [ ] **Step 2: Run** `npm test -- convex/domain/evidence.test.ts` and confirm failure.
- [ ] **Step 3: Add the evidence table and pure promotion logic**. Store raw customer text only in `messages`; evidence rows store bounded identifiers, confidence, provenance, and timestamps.
- [ ] **Step 4: Replace Shopify-specific model fields** with source-neutral identifiers and evidence arrays. Keep address, phone, credentials, and unrelated messages outside model context.
- [ ] **Step 5: Extend privacy tests** to reject undeclared evidence fields and secrets.
- [ ] **Step 6: Run** `npm test -- convex/domain/evidence.test.ts convex/agent/privacy.test.ts convex/agent/redaction.test.ts`.
- [ ] **Step 7: Commit** `feat: model source-neutral delivery evidence`.

### Task 4: CSV-Backed Agent Tools

**Files:**
- Modify: `convex/agent/contracts.ts`
- Modify: `convex/agent/toolSchemas.ts`
- Modify: `convex/agent/toolSchemas.test.ts`
- Modify: `convex/agent/tools.ts`
- Modify: `convex/agent/openai.ts`
- Modify: `convex/investigations.ts`

**Interfaces:**
- Replaces: `match_shopify_customer` with `find_orders`.
- Replaces: `collect_order_evidence` with `collect_delivery_evidence`.
- Produces: adapter result `{ source: "csv"; status: "matched" | "multiple" | "not_found" | "stale" }`.

- [ ] **Step 1: Update strict-schema tests** for `find_orders` and `collect_delivery_evidence`, and reject old Shopify-only names.
- [ ] **Step 2: Run** `npm test -- convex/agent/toolSchemas.test.ts` and confirm failure.
- [ ] **Step 3: Implement `find_orders`** against the active CSV import: exact order reference wins only when its normalized customer email matches the sender; otherwise match by sender and return zero, one, or multiple safe summaries.
- [ ] **Step 4: Implement `collect_delivery_evidence`** over Gmail messages, the selected CSV row, and courier replies. Mark rows older than 24 hours as stale.
- [ ] **Step 5: Update the model instruction**: zero or multiple matches must call the clarification tool; one fresh match may prepare a status response; stale or conflicting evidence must not produce an automatic answer.
- [ ] **Step 6: Run** `npm test -- convex/agent`.
- [ ] **Step 7: Commit** `refactor: make agent tools source neutral`.

### Task 5: Real Courier Email Loop

**Files:**
- Create: `convex/domain/courierMessage.ts`
- Test: `convex/domain/courierMessage.test.ts`
- Create: `convex/gmailClient.ts`
- Modify: `convex/courierReplies.ts`
- Modify: `convex/gmailPolling.ts`
- Modify: `convex/crons.ts`
- Modify: `convex/schema.ts`

**Interfaces:**
- Produces: `sendCourierRequest({ approvalId })` through the shared Gmail client.
- Produces: `routeInboundCourier(message): { caseId, attemptId } | null` using thread, sender, and tracking number.
- Produces: retry states `scheduled`, `sent`, `answered`, `failed`, and `exhausted`.

- [ ] **Step 1: Test exact reply matching** and reject wrong sender, wrong thread, missing tracking number, and already-answered attempts.
- [ ] **Step 2: Run** `npm test -- convex/domain/courierMessage.test.ts convex/domain/courierReply.test.ts` and confirm failure.
- [ ] **Step 3: Extract Gmail token refresh, MIME encoding, send, and draft helpers** from the three duplicated callers into `gmailClient.ts`.
- [ ] **Step 4: Replace `deliveryStatus: "simulated"`** with a real Gmail send guarded by an atomic attempt claim.
- [ ] **Step 5: Route inbound courier mail before customer classification**, persist courier-confirmed evidence, and schedule a `courier_reply` agent run.
- [ ] **Step 6: Make cron retries send real follow-ups** at most three times, three hours apart, then escalate.
- [ ] **Step 7: Remove `receiveSimulated` from production exports**; keep fixture helpers only in test files.
- [ ] **Step 8: Run** `npm test -- convex/domain/courierMessage.test.ts convex/domain/courierReply.test.ts convex/agent/orchestration.integration.test.ts`.
- [ ] **Step 9: Commit** `feat: run courier conversations through Gmail`.

### Task 6: One External Action Executor

**Files:**
- Create: `convex/actionExecution.ts`
- Modify: `convex/domain/actionSafety.ts`
- Modify: `convex/domain/actionSafety.test.ts`
- Modify: `convex/customerUpdates.ts`
- Modify: `convex/identityRequests.ts`
- Modify: `convex/courierReplies.ts`
- Modify: `convex/agent/tools.ts`
- Modify: `convex/schema.ts`

**Interfaces:**
- Produces: `claimAction({ approvalId, source }): ClaimResult`.
- Produces: `executeApproved({ approvalId, source })` for `customer_email` and `courier_email`.
- Produces: `source = "manager" | "agent_policy"` and a single execution receipt.

- [ ] **Step 1: Expand safety tests** for fresh CSV-confirmed evidence, courier-confirmed evidence, stale CSV rows, conflicts, corrections, missing proof, and duplicate action keys.
- [ ] **Step 2: Run** `npm test -- convex/domain/actionSafety.test.ts` and confirm failure.
- [ ] **Step 3: Move all claim logic into one mutation** that re-reads policy, proof, case, recipient, newest evidence, action key, and prior receipt before changing `approved` to `executing`.
- [ ] **Step 4: Route both manager and agent-policy sends through one action**. A second caller returns `already_claimed`; it never sends.
- [ ] **Step 5: Generate automatic customer text from checked evidence**. Preserve model text only for manager-reviewed drafts.
- [ ] **Step 6: Mark completion or failure once**, append an audit event, and escalate failed external sends.
- [ ] **Step 7: Run** `npm test -- convex/domain/actionSafety.test.ts convex/domain/customerUpdate.test.ts convex/agent`.
- [ ] **Step 8: Commit** `feat: centralize safe external action execution`.

### Task 7: CSV And Gmail Proof With Server-Side Activation

**Files:**
- Create: `convex/domain/onboardingProof.ts`
- Test: `convex/domain/onboardingProof.test.ts`
- Create: `convex/onboardingProof.ts`
- Modify: `convex/agentPolicies.ts`
- Modify: `convex/schema.ts`
- Modify: `convex/gmailClient.ts`

**Interfaces:**
- Produces: `start({ orderId }): { proofId }`, `get({ proofId })`, and `createDraft({ proofId })`.
- Produces: `activate({ proofId, confirmation: true })` which persists the selected policy.

- [ ] **Step 1: Test proof completion** requires a fresh CSV order, connected Gmail account, stable action key, one reconciled draft ID, and a completed timestamp.
- [ ] **Step 2: Run** `npm test -- convex/domain/onboardingProof.test.ts` and confirm failure.
- [ ] **Step 3: Expand `onboardingProofs`** with creator, stable action key, draft state, Gmail draft ID, timestamps, and error fields.
- [ ] **Step 4: Re-read the selected active CSV row**, reject stale or replaced imports, and create one founder-addressed unsent draft with subject `[WISMO PROOF - NOT SENT]` and Message-ID `<wismo-proof-{proofId}@wismo.ai>`.
- [ ] **Step 5: Reconcile by Message-ID before retries**. Ambiguous writes become `needs_reconciliation`; never create a blind duplicate.
- [ ] **Step 6: Activate verified mode only from a completed proof** and deactivate the prior policy in the same mutation.
- [ ] **Step 7: Run** `npm test -- convex/domain/onboardingProof.test.ts convex/agent/policy.test.ts`.
- [ ] **Step 8: Commit** `feat: prove Gmail actions before activation`.

### Task 8: CSV Setup And Honest Inbox

**Files:**
- Modify: `src/app/connect/RealSetupJourney.tsx`
- Modify: `src/app/connect/setupJourney.ts`
- Modify: `src/app/connect/setupJourney.test.ts`
- Modify: `src/app/connect/setupStorage.ts`
- Modify: `src/app/inbox/LiveCases.tsx`
- Modify: `src/app/inbox/[caseId]/page.tsx`
- Test: `src/app/connect/setupJourney.test.ts`

**Interfaces:**
- Consumes: stored policy, CSV import status, Gmail proof, agent runs, and case events.
- Produces: setup states `needs_gmail`, `needs_orders`, `needs_proof`, `ready`, and `active`.

- [ ] **Step 1: Test that setup requires Gmail plus one valid CSV import**, and local storage cannot mark the workspace active.
- [ ] **Step 2: Run** `npm test -- src/app/connect/setupJourney.test.ts src/app/connect/setupStorage.test.ts` and confirm failure.
- [ ] **Step 3: Replace the Shopify card with an `orders.csv` upload** showing filename, row count, imported time, newest status time, stale-row count, and validation errors.
- [ ] **Step 4: Replace local activation with stored policy and proof state**. Show exact reasons activation is blocked.
- [ ] **Step 5: Show source labels and confidence in the case timeline**, including `Gmail`, `Orders CSV`, `Courier`, and `Manager confirmed`.
- [ ] **Step 6: Hide simulation controls** and show retry, failure, approval, and escalation states from persisted records.
- [ ] **Step 7: Run** `npm test -- src/app/connect/setupJourney.test.ts src/app/connect/setupStorage.test.ts`.
- [ ] **Step 8: Commit** `feat: ship Gmail-first setup and case trace`.

### Task 9: Remove Shopify From The MVP Contract

**Files:**
- Modify: `convex/env.ts`
- Modify: `.env.example`
- Modify: `docs/design/real-onboarding-journey-repair.md`
- Modify: `milestones.md`
- Modify: user-facing copy under `src/app`

**Interfaces:**
- Produces: server environment and runtime with no Shopify requirement or call path.
- Preserves: source-neutral `OrderSource`, which a later Shopify connector can implement.

- [ ] **Step 1: Add an environment test** proving Gmail and OpenAI variables parse without Shopify settings.
- [ ] **Step 2: Remove Shopify environment values from the MVP environment schema**. Keep connector code isolated and unreachable from Gmail intake.
- [ ] **Step 3: Update product copy and milestones** so `orders.csv` is the current source and Shopify is described only as a future connector.
- [ ] **Step 4: Search** `rg -n -i "shopify.*required|required.*shopify|needs.*shopify" src convex docs` and remove remaining MVP claims.
- [ ] **Step 5: Run** `npm test && npm run lint && npx tsc --noEmit`.
- [ ] **Step 6: Commit** `docs: defer Shopify behind the order source contract`.

### Task 10: Release Proof

**Files:**
- Create: `tests/e2e/gmail-first-workflow.spec.ts`
- Modify: `vitest.config.mts` only if the new test location requires it.

**Interfaces:**
- Produces: automated seeded proof plus a documented live Gmail sandbox receipt.

- [ ] **Step 1: Add an end-to-end seeded test** covering CSV import, unrelated silence, unclear clarification, clear email matching, agent response, approval/verified execution, and duplicate suppression with Shopify absent.
- [ ] **Step 2: Run** `npm test` and fix all failures without weakening assertions.
- [ ] **Step 3: Run** `npm run lint`, `npx tsc --noEmit`, Convex code generation, and `npm run build`.
- [ ] **Step 4: Test at 1440x900, 768x1024, 390x844, keyboard-only, reduced motion, and 200% zoom**; record failures as release blockers.
- [ ] **Step 5: Run the live Gmail sandbox flow** with a unique test subject and verify one inbound case, one courier send, one matched reply, one customer action, and no duplicates.
- [ ] **Step 6: Record the live receipt** with message IDs, case ID, run ID, action key, timestamps, and redacted screenshots; never store credentials or customer data.
- [ ] **Step 7: Commit** `test: prove Gmail-first autonomous workflow`.

## Self-Review Result

- Spec coverage: Tasks 1-10 cover CSV import, all three email outcomes, evidence confidence, courier operation, policy enforcement, proof, setup, audit, and release checks.
- Placeholder scan: no placeholder implementation steps remain.
- Type consistency: evidence confidence, action source, proof state, and setup state names are stable across tasks.
- Explicit deferral: Shopify connection and writes, refunds, address changes, delivery changes, financial actions, multi-workspace tenancy, and customer-facing channels beyond Gmail are outside MVP V2.
