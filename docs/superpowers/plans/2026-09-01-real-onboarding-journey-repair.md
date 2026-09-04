# Agentic Onboarding and Core Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the missing WISMO agent runtime, safe automatic actions, and a five-stage onboarding journey that proves the agent using real Gmail and Shopify tools.

**Architecture:** A durable Convex agent run calls the OpenAI Responses API with eight strict function tools. Model output may select and propose actions, while a pure application policy decides whether each action is read-only, approval-required, automatically executable, or blocked. The onboarding proof uses the same runtime against a real Shopify order and ends by creating a real unsent Gmail draft.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Convex, Convex Auth, OpenAI Responses API, Gmail API, Shopify Admin GraphQL API, CSS Modules, Vitest

**Spec:** `docs/design/real-onboarding-journey-repair.md`

## Global Constraints

- Preserve `/connect` as the public one-field early-access form.
- Model output never directly sends email or writes Shopify data.
- Every tool uses `strict: true`, a closed JSON schema, and application-side authorization.
- Never send credentials, street addresses, phone numbers, or unrelated customer data to the model.
- `Draft for approval` never executes an external action without a manager.
- `Resolve verified cases` requires every safety predicate in the spec.
- Shopify tracking changes and corrections always require approval in the first release.
- Every external action uses a stable action key and atomic claim.
- The agent loop stops after eight tool rounds and escalates on repeated or invalid calls.
- Preserve the user's current uncommitted escalation, memory, timeline, and case UI changes.
- User-facing text is at least 12px; body and input text are 16px; controls are at least 44px.
- Verify keyboard use, 200% zoom, reduced motion, 1440×900, 768×1024, and 390×844.

---

## Milestone map

| # | Demonstrable result | Release gate |
|---:|---|---|
| 1 | A durable run records model and tool steps without executing external actions. | Required before orchestration |
| 2 | A new WISMO email advances from Shopify match to recommendation without `Run investigation`. | Required before live actions |
| 3 | WISMO sends a real courier request and resumes from the real reply. | Required for incomplete tracking cases |
| 4 | A persisted policy safely chooses observe, approval, automatic execution, or escalation. | Required before control selection |
| 5 | Every external action uses one atomic executor; verified mode remains locked. | Required before automatic execution |
| 6 | Capability inspection and a real proof draft unlock verified execution. | Required before `Resolve verified cases` appears |
| 7 | The five-stage onboarding exposes the live run and stores the founder's policy. | Required before routing users to inbox |
| 8 | Settings and login use the new setup boundary without breaking the waitlist. | Required before deployment |
| 9 | Automated, browser, and live sandbox checks pass. | Required before main |

## File map

- `convex/schema.ts` — agent runs, tool steps, policies, proof runs, and execution source.
- `convex/agent/contracts.ts` — shared agent and tool types.
- `convex/agent/toolSchemas.ts` — strict OpenAI function definitions.
- `convex/agent/openai.ts` — Responses API request/response adapter.
- `convex/agent/policy.ts` — pure action permission engine.
- `convex/agent/runtime.ts` — durable model/tool loop.
- `convex/agent/tools.ts` — bounded tool dispatcher over current domain functions.
- `convex/agentRuns.ts` — persistence queries and mutations.
- `convex/agentPolicies.ts` — founder policy query and mutation.
- `convex/onboardingProof.ts` — candidate orders, proof start, and Gmail draft creation.
- `convex/investigations.ts` — callable internal evidence collection.
- `convex/shopifyData.ts` — schedules the runtime after matching.
- `convex/courierReplies.ts` — real courier send, match, resume, and retries.
- `convex/gmailPolling.ts` and `convex/gmailData.ts` — route courier replies before customer classification.
- `convex/crons.ts` — due courier execution.
- `src/app/setup/*` — live five-stage onboarding and trace.
- `src/app/settings/*` — founder controls after setup.
- `src/app/login/*`, `src/app/inbox/LiveCases.tsx`, `convex/integrations.ts` — correct routing.

### Milestone 1: Durable model and tool runtime

**Files:**
- Create: `convex/agent/contracts.ts`
- Create: `convex/agent/toolSchemas.ts`
- Create: `convex/agent/toolSchemas.test.ts`
- Create: `convex/agent/openai.ts`
- Create: `convex/agent/openai.test.ts`
- Create: `convex/agent/privacy.ts`
- Create: `convex/agent/persistence.ts`
- Create: `convex/agent/persistence.test.ts`
- Create: `convex/agentRuns.ts`
- Modify: `convex/schema.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `AgentToolName`, `AgentToolCall`, `AgentToolResult`, and `AgentRunStatus`.
- Produces: `agentTools`, an eight-item strict function-tool array.
- Produces: `createAgentResponse(input): Promise<AgentResponse>`.
- Produces: internal mutations `start`, `recordModelResponse`, `startStep`, `finishStep`, and `fail`.

- [ ] **Step 1: Write strict-schema tests**

```ts
import { describe, expect, it } from "vitest";
import { agentTools } from "./toolSchemas";

describe("agent tool schemas", () => {
  it("keeps a small, strict, closed tool set", () => {
    expect(agentTools).toHaveLength(8);
    expect(agentTools.map((tool) => tool.name)).toEqual([
      "read_case_context",
      "match_shopify_customer",
      "select_only_order",
      "collect_order_evidence",
      "prepare_customer_update",
      "prepare_identity_request",
      "prepare_courier_request",
      "escalate_case",
    ]);
    for (const tool of agentTools) {
      expect(tool.strict).toBe(true);
      expect(tool.parameters.additionalProperties).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run the schema test and confirm the missing module failure**

Run: `npm test -- convex/agent/toolSchemas.test.ts`

Expected: FAIL resolving `./toolSchemas`.

- [ ] **Step 3: Add durable tables**

Add these fields and indexes to `convex/schema.ts`:

```ts
agentRuns: defineTable({
  caseId: v.optional(v.id("cases")),
  proofId: v.optional(v.id("onboardingProofs")),
  trigger: v.union(v.literal("inbound"), v.literal("courier_reply"), v.literal("retry"), v.literal("onboarding_proof")),
  status: v.union(v.literal("queued"), v.literal("running"), v.literal("waiting"), v.literal("completed"), v.literal("failed"), v.literal("escalated")),
  round: v.number(),
  attempt: v.number(),
  leaseVersion: v.number(),
  leaseExpiresAt: v.optional(v.number()),
  nextRunAt: v.optional(v.number()),
  previousResponseId: v.optional(v.string()),
  pendingCalls: v.optional(v.any()),
  pendingOutputs: v.optional(v.any()),
  inputTokens: v.number(),
  outputTokens: v.number(),
  startedAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
  finalText: v.optional(v.string()),
  error: v.optional(v.string()),
}).index("by_case", ["caseId"]).index("by_proof", ["proofId"]).index("by_status", ["status"]),
agentSteps: defineTable({
  runId: v.id("agentRuns"),
  sequence: v.number(),
  kind: v.union(v.literal("model"), v.literal("tool"), v.literal("policy")),
  name: v.string(),
  status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed"), v.literal("blocked")),
  input: v.optional(v.any()),
  output: v.optional(v.any()),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  error: v.optional(v.string()),
}).index("by_run", ["runId"]),
```

- [ ] **Step 4: Define the eight strict tools**

Use no arguments for tools whose case or order is already fixed by run context. `prepare_customer_update` accepts required `reason` and `draft` strings. `prepare_courier_request` accepts required `question`. `escalate_case` accepts required `reason` and `recommendation`. Every schema sets `additionalProperties: false` and marks all declared properties required.

- [ ] **Step 5: Test the Responses adapter parser**

```ts
it("extracts calls, response id, and usage", () => {
  expect(parseAgentResponse({
    id: "resp_1",
    output: [{ type: "function_call", call_id: "call_1", name: "read_case_context", arguments: "{}" }],
    usage: { input_tokens: 120, output_tokens: 30 },
  })).toEqual({
    responseId: "resp_1",
    calls: [{ callId: "call_1", name: "read_case_context", arguments: {} }],
    finalText: "",
    inputTokens: 120,
    outputTokens: 30,
  });
});
```

- [ ] **Step 6: Implement the Responses API adapter**

POST to `https://api.openai.com/v1/responses` with `Authorization: Bearer ${OPENAI_API_KEY}`. Read the model from required `OPENAI_MODEL`. Use `previous_response_id` plus `function_call_output` items for continuation. Reject unknown call names, invalid JSON, missing response IDs, and non-2xx responses. Do not store or expose reasoning content.

Add to `.env.example`:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
```

- [ ] **Step 7: Implement run persistence**

`start` returns an active run for the same case/trigger instead of inserting another. `claimRound` atomically leases one round, increments `attempt` and `leaseVersion`, and returns that version. Every later write requires the expected version, `running` status, and an unexpired lease; a stale worker cannot update a recovered run. Terminal runs reject every later write. `recordToolBatch` requires the exact unique pending call-ID set and stores all outputs atomically before releasing the lease. No action contains the full eight-round loop. `startStep` assigns `sequence = existingSteps.length + 1`. Token totals are incremented only by `recordModelResponse`.

Model context, continuation output, and audit persistence use constructed allowlisted DTOs containing only bounded message subject/body, order name/products/fulfillment/tracking, bounded prior support text, and named event facts. The OpenAI adapter accepts only those DTOs; arbitrary strings and `unknown` tool outputs cannot cross the network boundary. Do not rely on key-name redaction for arbitrary nested `v.any()` values.

The response parser requires a completed API response, rejects incomplete/failed/refusal/empty output and duplicate call IDs, and enforces maximum lengths on every model-provided string. Failed runs close their active step with its error. Completed runs persist a bounded final recommendation.

- [ ] **Step 8: Run gates and commit**

Run: `npm test -- convex/agent/toolSchemas.test.ts convex/agent/openai.test.ts`

Expected: PASS.

Run: `npx convex codegen && npm test`

Expected: code generation and all tests pass.

```bash
git add convex/schema.ts convex/agent convex/agentRuns.ts convex/_generated .env.example
git commit -m "feat: add durable agent runtime contract"
```

### Milestone 2: Automatic case orchestration

**Files:**
- Create: `convex/agent/tools.ts`
- Create: `convex/agent/runtime.ts`
- Create: `convex/agent/runtime.test.ts`
- Modify: `convex/investigations.ts`
- Modify: `convex/shopifyData.ts`
- Modify: `convex/gmailData.ts`

**Interfaces:**
- Consumes: Milestone 1 tool schemas, adapter, and run persistence.
- Produces: `runRound({ runId }): Promise<void>` internal action that claims and completes one leased round.
- Produces: `dispatchTool({ runId, call }): Promise<AgentToolResult>`.
- Produces: internal `investigations:collectForCase` callable without a browser actor.

- [ ] **Step 1: Test loop limits and duplicate calls**

```ts
it("stops after eight tool rounds", async () => {
  const result = await runRounds(fakeRuntime({ repeat: "read_case_context", rounds: 9 }));
  expect(result.status).toBe("escalated");
  expect(result.reason).toBe("Agent exceeded the eight-round tool limit");
});

it("blocks the same mutating proposal twice", async () => {
  const result = await runRounds(fakeRuntime({ repeat: "prepare_customer_update", rounds: 2 }));
  expect(result.executedCalls).toHaveLength(1);
  expect(result.status).toBe("escalated");
});
```

- [ ] **Step 2: Refactor investigation collection for internal use**

Move evidence collection from `investigations:run` into `collectForCase`, an internal mutation that accepts `caseId` and optional `actorUserId`. It stores evidence but creates no approval. Keep `run` as an authenticated retry wrapper temporarily. All proposal creation moves behind the policy-aware tool dispatcher so evidence collection cannot bypass policy or double-propose.

- [ ] **Step 3: Implement the bounded tool dispatcher**

Each dispatcher branch uses run context for `caseId`; the model never supplies database IDs. Read tools return redacted summaries. Proposal tools create or reuse approval records through existing action keys. `escalate_case` calls the shared `escalateCase` helper. Unknown calls fail the run.

- [ ] **Step 4: Implement the model/tool loop**

Start with fixed instructions that state mission, allowed tools, escalation conditions, and the current workspace policy. Each scheduled `runRound` claims a lease, performs one model response or one persisted tool batch, records results, releases the lease, and schedules the next round. Complete when the response has final text and no calls. A recovery action requeues expired leases. Escalate on eight rounds, repeated mutating calls, invalid schemas, or model failure.

- [ ] **Step 5: Schedule the agent automatically**

Schedule a run for every Shopify outcome: exact match, multiple orders, no match, and Shopify error. A shared database helper creates the run inside the current mutation and schedules its first round. For one order, the agent continues through evidence collection. For multiple orders, it presents bounded candidate handles and prepares a customer selection request; it never guesses. For no match, it prepares the identity request. Remove the live UI's dependency on a manager pressing `Run investigation`; keep the button only as a retry for a failed run.

- [ ] **Step 6: Verify the milestone demonstration**

Send a WISMO fixture through the existing Gmail normalization path. Assert stored events appear in this order: `email_received`, `shopify_customer_matched`, `investigation_completed`, then either `customer_update_prepared` or `courier_request_prepared`.

Run: `npm test -- convex/agent/runtime.test.ts convex/domain/investigation.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add convex/agent/tools.ts convex/agent/runtime.ts convex/agent/runtime.test.ts convex/investigations.ts convex/shopifyData.ts convex/gmailData.ts
git commit -m "feat: run WISMO cases automatically"
```

### Milestone 3: Real courier conversations

**Files:**
- Create: `convex/domain/courierRouting.ts`
- Create: `convex/domain/courierRouting.test.ts`
- Modify: `convex/courierReplies.ts`
- Modify: `convex/gmailPolling.ts`
- Modify: `convex/gmailData.ts`
- Modify: `convex/crons.ts`
- Modify: `convex/schema.ts`

**Interfaces:**
- Produces: `matchCourierInbound({ from, threadId, attempts, contacts })`.
- Produces: `parseCourierReply(text): ParsedCourierReply | null`, whose facts remain unverified until tracking-number and thread checks pass.
- Produces: `courierReplies:sendPrepared` internal action using Gmail.
- Produces: `courierReplies:routeInbound` internal mutation.
- Produces: `courierReplies:runDueAttempts` internal action.

- [ ] **Step 1: Test exact inbound routing**

```ts
it("matches only the configured sender and Gmail thread", () => {
  expect(matchCourierInbound({
    from: "Northline <ops@northline.example>",
    threadId: "gmail-thread-1",
    attempts: [{ id: "attempt-1", threadId: "gmail-thread-1" }],
    contacts: [{ id: "contact-1", email: "ops@northline.example", active: true }],
  })).toEqual({ attemptId: "attempt-1", contactId: "contact-1" });
});

it("rejects a sender match on the wrong thread", () => {
  expect(matchCourierInbound({
    from: "ops@northline.example",
    threadId: "other-thread",
    attempts: [{ id: "attempt-1", threadId: "gmail-thread-1" }],
    contacts: [{ id: "contact-1", email: "ops@northline.example", active: true }],
  })).toBeNull();
});
```

- [ ] **Step 2: Store real Gmail thread IDs**

Add `threadId`, stable `actionKey`, `providerId`, and status `scheduled | executing | sent | answered | failed | ambiguous` to `contactAttempts`. Replace the simulated first-message insertion with a prepared courier approval. An atomic claim changes `scheduled` to `executing` before Gmail send. The action stores the returned message and thread ID, then marks the attempt sent. If Gmail may have accepted the send but returned an ambiguous result, mark `ambiguous` and escalate; never retry it automatically.

- [ ] **Step 3: Route courier replies before customer classification**

In `gmailPolling`, after normalization and before `classifyInboundEmail`, ask `gmailData` for active courier-routing data. Require an exact active contact, Gmail thread, sent unanswered attempt, and non-duplicate provider message. Parse courier prose into candidate facts, then deterministically require the expected tracking number. If parsing or validation fails, escalate the matched case. A configured courier email with no unique waiting case is stored for human attention without attaching it to an arbitrary case.

- [ ] **Step 4: Resume the agent from a matched reply**

`routeInbound` stores the real inbound message, links it to the contact attempt, validates tracking through `matchCourierReply`, saves the scan, starts an `agentRuns` row with trigger `courier_reply`, and schedules `runCase`.

- [ ] **Step 5: Execute retries automatically**

`runDueAttempts` queries attempts by `scheduledAt`, sends unsent due attempts, stops after three sent attempts, and escalates. Add a five-minute cron. Keep the three-hour interval from `courierRetryPolicy`.

- [ ] **Step 6: Remove simulation UI and verify**

Remove `receiveSimulated` and the `Simulate confirmed courier reply` button only after the real polling path passes tests. The live case view shows `Sent`, `Waiting`, `Reply matched`, or `Escalated` from stored attempt state.

Run: `npm test -- convex/domain/courierRouting.test.ts convex/domain/courierReply.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add convex/domain/courierRouting.ts convex/domain/courierRouting.test.ts convex/courierReplies.ts convex/gmailPolling.ts convex/gmailData.ts convex/crons.ts convex/schema.ts src/app/inbox/LiveCases.tsx
git commit -m "feat: run real courier conversations"
```

### Milestone 4: Persist and enforce workspace control

**Files:**
- Create: `convex/agent/policy.ts`
- Create: `convex/agent/policy.test.ts`
- Create: `convex/agentPolicies.ts`
- Modify: `convex/schema.ts`
- Modify: `convex/agent/tools.ts`

**Interfaces:**
- Produces: `AutonomyMode = "investigate" | "approval" | "verified"`.
- Produces: `evaluateAction(input): "observe" | "approval" | "execute" | "escalate"`.
- Produces: `getCurrent` and `saveDraft` founder query/mutation. Activation is added after proof in Milestone 6.

- [ ] **Step 1: Write the policy matrix tests**

```ts
const verified = {
  mode: "verified" as const,
  proofComplete: true,
  exactIdentity: true,
  orderResolved: true,
  exactTracking: true,
  unambiguousScan: true,
  hasConflict: false,
  isCorrection: false,
  alreadyExecuted: false,
  courierConfigured: true,
};

it("executes a verified routine customer update", () => {
  expect(evaluateAction({ ...verified, kind: "customer_email" })).toBe("execute");
});

it.each([
  ["exactIdentity", false],
  ["orderResolved", false],
  ["exactTracking", false],
  ["unambiguousScan", false],
  ["proofComplete", false],
  ["hasConflict", true],
  ["isCorrection", true],
] as const)("does not auto-execute when %s is unsafe", (key, value) => {
  expect(evaluateAction({ ...verified, kind: "customer_email", [key]: value })).not.toBe("execute");
});
```

- [ ] **Step 2: Add the singleton policy table**

```ts
agentPolicies: defineTable({
  mode: v.union(v.literal("investigate"), v.literal("approval"), v.literal("verified")),
  active: v.boolean(),
  proofId: v.optional(v.id("onboardingProofs")),
  createdBy: v.id("users"),
  updatedAt: v.number(),
}).index("by_active", ["active"]),
```

Only founders may save draft policy. Until Milestone 6 records a completed proof, runtime treats `verified` as `approval` and the UI must not offer activation.

- [ ] **Step 3: Implement the exact permission matrix**

- `investigate`: read tools execute; external proposals return `observe`.
- `approval`: read tools execute; every external action returns `approval`.
- `verified`: safe customer and courier email may return `execute`; Shopify note/tracking and corrections return `approval`; conflicts and missing identity return `escalate`.
- Any duplicate action returns `escalate` before model text is considered.

- [ ] **Step 4: Apply policy after every proposal tool**

Record the policy input and decision as an `agentSteps` row. `approval` creates a pending approval. Before Milestone 6, `execute` is downgraded to `approval`. `observe` records the recommendation without creating an executable approval. `escalate` calls `escalateCase`.

Add `decisionSource: v.optional(v.union(v.literal("manager"), v.literal("agent_policy")))` to approvals. Existing manager claims write `manager`.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- convex/agent/policy.test.ts convex/domain/safety.test.ts`

Expected: PASS.

```bash
git add convex/agent/policy.ts convex/agent/policy.test.ts convex/agent/tools.ts convex/agentPolicies.ts convex/schema.ts
git commit -m "feat: enforce workspace agent policy"
```

### Milestone 5: Centralize external action execution

**Files:**
- Create: `convex/actionExecution.ts`
- Create: `convex/domain/actionSafety.ts`
- Create: `convex/domain/actionSafety.test.ts`
- Modify: `convex/customerUpdates.ts`
- Modify: `convex/identityRequests.ts`
- Modify: `convex/courierReplies.ts`
- Modify: `convex/shopifyNotes.ts`

**Interfaces:**
- Produces: `verifiedCustomerAction(input): SafetyResult`.
- Produces: `executeApproved({ approvalId, source })` internal action dispatcher.

- [ ] **Step 1: Test atomic and evidence safety**

```ts
it("returns every failed predicate instead of a vague denial", () => {
  expect(verifiedCustomerAction({
    exactIdentity: true,
    orderResolved: true,
    orderTrackingNumber: "TRACK-1",
    scanTrackingNumber: "TRACK-2",
    scanIsNewest: true,
    hasConflict: false,
    isCorrection: false,
  })).toEqual({ allowed: false, reasons: ["tracking_number_mismatch"] });
});
```

- [ ] **Step 2: Centralize action claiming**

Move pending/approved/executing validation into one internal mutation. It re-reads case, selected order, newest stored scan, active policy, proof state, and action payload; then recomputes every predicate and checks an evidence hash before marking `executing`. A second caller receives `already_claimed` without sending.

- [ ] **Step 3: Separate manager and agent execution entry points**

Public approval actions authenticate a manager, mark `decisionSource: "manager"`, and call the dispatcher. Agent policy uses only the internal dispatcher and may execute only approvals already marked `approved` by policy. Both paths reuse the existing Gmail and Shopify finish/fail mutations.

- [ ] **Step 4: Use deterministic text for automatic customer sends**

Manager-reviewed drafts may contain model-written text. Automatic verified sends use `customerUpdateDraft` from checked order and tracking fields; the model chooses the action but cannot invent the automatically sent facts. Courier requests use a fixed minimal template plus the model's question after stripping email addresses, phone numbers, and freeform customer details.

- [ ] **Step 5: Keep verified execution locked until proof**

The dispatcher supports manager execution now. Agent-policy execution returns `proof_required` until Milestone 6 supplies a completed proof and binds it to the active policy.

- [ ] **Step 6: Prove safe and unsafe cases**

Create fixtures for exact match, tracking mismatch, stale scan, two active orders, conflict, correction, already-executed action, and missing proof. Assert only the exact-match fixture reaches `executing`.

Run: `npm test -- convex/domain/actionSafety.test.ts convex/domain/customerUpdate.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add convex/actionExecution.ts convex/domain/actionSafety.ts convex/domain/actionSafety.test.ts convex/customerUpdates.ts convex/identityRequests.ts convex/courierReplies.ts convex/shopifyNotes.ts
git commit -m "feat: execute verified agent actions safely"
```

### Milestone 6: Real onboarding proof backend

**Files:**
- Create: `convex/onboardingInspection.ts`
- Create: `convex/onboardingProof.ts`
- Create: `convex/domain/onboardingProof.ts`
- Create: `convex/domain/onboardingProof.test.ts`
- Modify: `convex/schema.ts`
- Modify: `convex/agent/runtime.ts`
- Modify: `convex/agent/tools.ts`

**Interfaces:**
- Produces: `inspectCapabilities(): Promise<InspectionView>` founder action and `getInspection(): InspectionView | null` query.
- Produces: `listCandidateOrders(): Promise<ProofOrder[]>` action.
- Produces: `start({ shopifyOrderId }): Promise<{ proofId, runId }>` action.
- Produces: `get({ proofId }): ProofView` query.
- Produces: `createProofDraft({ proofId, actionKey, subject, text }): Promise<{ draftId }>` internal action.
- Produces: `agentPolicies:activate({ proofId, confirmation }): Promise<{ active: true }>` founder mutation.

- [ ] **Step 1: Test proof completion rules**

```ts
it("requires every deterministic proof checkpoint", () => {
  expect(proofStatus({ orderReadAt: 1, trackingCheckedAt: 2, draftPreparedAt: 3, gmailDraftId: "draft-1", runCompletedAt: 4 })).toBe("completed");
  expect(proofStatus({ orderReadAt: 1, trackingCheckedAt: 2, draftPreparedAt: 3, gmailDraftId: undefined, runCompletedAt: 4 })).toBe("failed");
});
```

- [ ] **Step 2: Add proof persistence**

```ts
onboardingProofs: defineTable({
  createdBy: v.id("users"),
  shopifyOrderId: v.string(),
  orderName: v.string(),
  status: v.union(v.literal("queued"), v.literal("running"), v.literal("completed"), v.literal("failed")),
  actionKey: v.string(),
  runId: v.optional(v.id("agentRuns")),
  gmailDraftId: v.optional(v.string()),
  draftStatus: v.union(v.literal("pending"), v.literal("creating"), v.literal("created"), v.literal("needs_reconciliation"), v.literal("failed")),
  orderReadAt: v.optional(v.number()),
  trackingCheckedAt: v.optional(v.number()),
  draftPreparedAt: v.optional(v.number()),
  runCompletedAt: v.optional(v.number()),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
  error: v.optional(v.string()),
}).index("by_creator", ["createdBy"]).index("by_action_key", ["actionKey"]).index("by_status", ["status"]),
```

- [ ] **Step 3: Persist the Learn capability inspection**

Add a singleton `onboardingInspections` table with Gmail scopes, Shopify scopes, fulfilled-order count, tracked-order count, carrier names, courier-contact readiness, proposed brief, corrected brief, inspectedAt, and completedAt. `inspectCapabilities` decrypts credentials only inside the action, checks Gmail granted scopes, queries Shopify `currentAppInstallation.accessScopes`, samples at most five fulfilled orders, and stores aggregate results without customer address or phone. A founder correction writes the corrected brief plus explicit reusable rules.

- [ ] **Step 4: Fetch safe proof candidates from Shopify**

Query at most five recent fulfilled orders with a Shopify-owned tracking number. Return order ID, order name, created date, fulfillment status, product names, and tracking number. Do not claim a carrier event unless a real stored courier reply exists. Do not return customer address or phone. Restrict the action to founders in this single-workspace V1 deployment.

- [ ] **Step 5: Start proof mode through a proof-specific runtime context**

Create or reuse the proof by stable action key, create its run, then schedule `runRound` with `{ kind: "proof", proofId }` context. The dispatcher has explicit case and proof branches. Proof branches never call case mutations or create approvals: they re-read the selected Shopify order, check Shopify fulfillment and tracking ownership, prepare a founder-addressed update, and route the external proposal only to `createProofDraft`.

- [ ] **Step 6: Create one real unsent Gmail draft safely**

Atomically claim `pending -> creating`, then call `POST https://gmail.googleapis.com/gmail/v1/users/me/drafts` with a MIME message addressed to the connected Gmail account. Prefix the subject with `[WISMO PROOF — NOT SENT]` and include stable `Message-ID: <wismo-proof-{proofId}@wismo.ai>`. Before retries, search recent drafts for that Message-ID and reuse it. An ambiguous create becomes `needs_reconciliation`, never an automatic second create. Store only the returned draft ID. Do not add an outbound `messages` row because nothing was sent.

- [ ] **Step 7: Complete proof and activate policy transactionally**

Complete only after all five timestamp/draft checkpoints exist. `agentPolicies:activate({ proofId, confirmation: true })` verifies founder access, the current draft policy, proof ownership, completed checkpoints, and a matching single-workspace integration set in one transaction. It deactivates any prior active policy, binds the proof ID, and enables real `verified` policy execution. The onboarding proof click is recorded as explicit authorization for its one setup-only Gmail draft even under `investigate` mode.

- [ ] **Step 8: Expose the stored trace**

`get` returns proof status plus ordered `agentSteps` with redacted input/output, timestamps, and failures. It never synthesizes progress from timers.

Run: `npm test -- convex/domain/onboardingProof.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add convex/onboardingInspection.ts convex/onboardingProof.ts convex/domain/onboardingProof.ts convex/domain/onboardingProof.test.ts convex/schema.ts convex/agent/runtime.ts convex/agent/tools.ts convex/agentPolicies.ts
git commit -m "feat: prove WISMO with live tools"
```

### Milestone 7: Five-stage agentic onboarding UI

**Files:**
- Create: `src/app/ConvexClientProvider.tsx`
- Create: `src/app/setup/layout.tsx`
- Create: `src/app/setup/page.tsx`
- Create: `src/app/setup/SetupJourney.tsx`
- Create: `src/app/setup/setupState.ts`
- Create: `src/app/setup/setupState.test.ts`
- Create: `src/app/setup/setup.module.css`
- Modify: `src/app/connect/layout.tsx`
- Modify: `src/app/login/layout.tsx`
- Modify: `src/app/inbox/layout.tsx`
- Modify: `convex/integrations.ts`

**Interfaces:**
- Consumes: live integrations, policy, proof candidate, proof run, and activation APIs.
- Produces: stages `brief | sources | learn | proof | activate`.

- [ ] **Step 1: Test stage gating**

```ts
it.each([
  [{ policySaved: false, gmail: false, shopify: false, briefReady: false, proof: "idle", active: false }, "brief"],
  [{ policySaved: true, gmail: false, shopify: false, briefReady: false, proof: "idle", active: false }, "sources"],
  [{ policySaved: true, gmail: true, shopify: true, briefReady: false, proof: "idle", active: false }, "learn"],
  [{ policySaved: true, gmail: true, shopify: true, briefReady: true, proof: "idle", active: false }, "proof"],
  [{ policySaved: true, gmail: true, shopify: true, briefReady: true, proof: "completed", active: false }, "activate"],
] as const)("selects the first incomplete stage", (state, expected) => {
  expect(stageForSetup(state)).toBe(expected);
});

it("keeps failed proof in proof with a retry action", () => {
  expect(stageForSetup({ policySaved: true, gmail: true, shopify: true, briefReady: true, proof: "failed", active: false })).toBe("proof");
});

it("never sends support agents through founder setup", () => {
  expect(accessForSetup({ role: "support_agent", active: false })).toBe("inbox");
});
```

- [ ] **Step 2: Share the Convex provider and add `/setup`**

Move the existing provider to `src/app/ConvexClientProvider.tsx` and update route layouts. `/setup` is `noindex`, reports missing configuration plainly, and uses Google sign-in with `redirectTo: "/setup"`. Change Gmail OAuth callbacks from `/connect` to `/setup`.

- [ ] **Step 3: Build Brief and Sources**

Brief stores one of the three real modes through `agentPolicies:saveDraft`. Sources use the live Gmail and Shopify actions, show exact permissions, and render stored account labels. Shopify remains locked until Gmail succeeds.

- [ ] **Step 4: Build Learn from real inspection**

Call and subscribe to the stored capability inspection from Milestone 6. Show granted Gmail/Shopify capability checks, evidence available, tracking-number coverage, courier contact readiness, allowed actions, and escalation conditions. Missing order-read or draft scopes block Proof with a concrete reconnect message. Corrections create founder rules through the existing `settings:addRule` mutation and mark the inspection complete.

- [ ] **Step 5: Build Proof around the stored trace**

Let the founder select one returned `ProofOrder`, explicitly authorize the one unsent setup draft, and subscribe to `onboardingProof:get`. The backend—not the button—deduplicates starts. Render each stored tool step as it arrives, including queued, running, failed, reconciliation, and retry states. After completion, show the connected Gmail label, draft ID, and a general Gmail drafts link with instructions instead of assuming the inbox is account slot `u/0`.

- [ ] **Step 6: Build Activate**

Show the proof order, Gmail draft result, policy matrix, permanent exclusions, and a required confirmation. Call `agentPolicies:activate({ proofId, confirmation: true })`, then route to `/inbox`. Activation remains disabled unless the current policy's proof status is `completed`.

- [ ] **Step 7: Apply the interface direction**

Intent: a founder supervises a new operator's first shift. Hierarchy: the current agent action is the focal element. Palette: paper, ink, and cobalt from the spec. Depth: surface shifts and quiet rules. Typography: Archivo plus IBM Plex Mono. Spacing: 4px base with 56px primary controls. Use a 296px desktop manifest rail and compact sticky mobile progress; show no fake pulse when no work is running.

- [ ] **Step 8: Run checks and commit**

Run: `npm test -- src/app/setup/setupState.test.ts`

Expected: PASS.

Run: `npm run lint && npm run build`

Expected: both pass.

```bash
git add src/app/ConvexClientProvider.tsx src/app/setup src/app/connect/layout.tsx src/app/login/layout.tsx src/app/inbox/layout.tsx convex/integrations.ts
git commit -m "feat: ship agentic onboarding journey"
```

### Milestone 8: Settings and readiness routing

**Files:**
- Create: `src/app/settings/layout.tsx`
- Create: `src/app/settings/page.tsx`
- Create: `src/app/settings/FounderSettings.tsx`
- Create: `src/app/settings/settings.module.css`
- Create: `src/app/login/loginDestination.ts`
- Create: `src/app/login/loginDestination.test.ts`
- Modify: `src/proxy.ts`
- Modify: `convex/access.ts`
- Modify: `src/app/connect/RealSetupJourney.tsx`
- Modify: `src/app/connect/setup.module.css`
- Modify: `src/app/login/LoginForm.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/inbox/LiveCases.tsx`

**Interfaces:**
- Produces: founder-only `/settings` with integrations, policy, team, contacts, rules, and memory review.
- Produces: `loginDestination(status): "/setup" | "/inbox"`.

- [ ] **Step 1: Move settings without losing current work**

Move all live controls from `RealSetupJourney.tsx`, including the uncommitted `MemoryReviewList`, to `FounderSettings.tsx`. Add the active policy and proof receipt. Compare every Convex reference before removing `RealSetupJourney.tsx` and `setup.module.css`.

- [ ] **Step 2: Test login destinations**

```ts
it("sends incomplete founders to setup", () => {
  expect(loginDestination({ role: "founder", activePolicy: false })).toBe("/setup");
});

it("sends active founders and support agents to inbox", () => {
  expect(loginDestination({ role: "founder", activePolicy: true })).toBe("/inbox");
  expect(loginDestination({ role: "support_agent", activePolicy: false })).toBe("/inbox");
});
```

- [ ] **Step 3: Route from stored readiness**

After Google OAuth returns to `/login`, wait for both profile and active-policy queries. Incomplete founders go to `/setup`; active founders and support agents go to `/inbox`. Update `src/proxy.ts` for direct and refreshed `/login`, `/setup`, `/settings`, and `/inbox` access. Signed-out inbox actions point to `/login`. Landing calls to action remain on `/connect`.

- [ ] **Step 4: Repair support-agent invitations**

Stop generating `/connect?invite=...`. Add a private acceptance route or send invitees to `/login` with server-validated token, exact invited Google email, expiry, and single-use acceptance. Test wrong email, expired token, reused token, and successful acceptance. Never treat the public waitlist as invite acceptance.

- [ ] **Step 5: Remove stale simulation copy**

The local login configuration error no longer advertises the simulation. Keep the old simulated onboarding files until live onboarding passes Milestone 9; remove them in a separate cleanup commit.

- [ ] **Step 6: Run checks and commit**

Run: `npm test -- src/app/login/loginDestination.test.ts`

Expected: PASS.

Run: `npm test && npm run lint && npm run build`

Expected: all pass.

```bash
git add src/app/settings src/app/login src/app/inbox/LiveCases.tsx src/app/connect/RealSetupJourney.tsx src/app/connect/setup.module.css src/proxy.ts convex/access.ts
git commit -m "feat: route workspaces through agent setup"
```

### Milestone 9: Release verification

**Files:**
- Verify: all files changed in Milestones 1–8.
- Modify: `docs/design/real-onboarding-journey-repair.md` only when verified behavior requires a factual correction.

**Interfaces:**
- Produces: a go/no-go decision for main.

- [ ] **Step 1: Run automated gates**

Run: `npx convex codegen && npm test && npm run lint && npm run build`

Expected: code generation succeeds, every test passes, lint has zero errors, and the production build completes.

- [ ] **Step 2: Run an OpenAI adapter smoke test**

With `OPENAI_API_KEY` and `OPENAI_MODEL` configured in a non-production Convex deployment, run one fixture that permits only `read_case_context`. Confirm a model response ID, tool call ID, tool result, and token counts are stored; confirm no credential or hidden reasoning text is stored. The implementation follows the [official function-calling flow](https://developers.openai.com/api/docs/guides/function-calling).

- [ ] **Step 3: Run the live onboarding proof**

Use a test Gmail inbox and Shopify development store. Complete Brief, Sources, Learn, Proof, and Activate. Confirm the selected real order appears, the timeline is backed by stored steps, and an unsent `[WISMO PROOF — NOT SENT]` draft exists in Gmail. Confirm no customer email or Shopify mutation occurred.

- [ ] **Step 4: Verify policy modes**

Run the same verified fixture under all modes. `investigate` records a recommendation only. `approval` creates a pending approval. `verified` sends the deterministic customer update once. Repeat with a tracking mismatch and confirm no send occurs.

- [ ] **Step 5: Verify the real courier loop**

Send a request to a configured test courier mailbox, reply in the same Gmail thread, and confirm the correct case resumes. Reply from a different sender and confirm escalation without a customer or Shopify action.

- [ ] **Step 6: Verify interface quality**

Check every onboarding state at 1440×900, 768×1024, and 390×844; repeat Proof at 200% zoom and with reduced motion. Verify keyboard order, live announcements, visible focus, no overlap, no horizontal scroll, and no text below the minimum size.

- [ ] **Step 7: Remove the simulation separately**

After the deployed proof passes, remove `OnboardingJourney.tsx`, `onboardingContent*`, `onboardingReducer*`, `onboardingStorage*`, `onboardingTypes.ts`, `simulatedConnections*`, and the old onboarding `page.module.css` only if no demo route imports them.

- [ ] **Step 8: Commit verification corrections**

```bash
git add docs/design/real-onboarding-journey-repair.md
git commit -m "docs: record verified agentic onboarding"
```

## Self-review result

- Spec coverage: each missing core capability maps to Milestones 1–6; onboarding and routing map to Milestones 7–8; all acceptance checks map to Milestone 9.
- Placeholder scan: no deferred implementation markers remain.
- Type consistency: run, policy, proof, tool, and routing names are stable across milestones.
- Safety check: model choice and external execution remain separate in every path.
- Product check: onboarding now demonstrates real reasoning, real tool use, and one real safe action instead of reducing the product to connection setup.
