# Unknown Sender Identity Request Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Milestone 7 by preparing a safe, manager-approved request for checkout email and order number when a WISMO sender does not exactly match a Shopify customer.

**Architecture:** The Shopify no-match path creates one pending customer-email approval in the same database transaction that moves the case to `identity_needed`. The browser shows the proposed identity request without any order data. An authenticated manager can approve it once; a server action then sends the saved draft through Gmail and records the provider result.

**Tech Stack:** Convex actions, mutations, queries, Gmail REST API, React 19, TypeScript, Vitest

**Spec:** `../milestones.md`, Milestone 7, plus the “Unknown sender identity flow” and approval requirements in `../scoping.md`

## Global Constraints

- Ask only for the checkout email and order number.
- Never expose customer, order, fulfillment, or tracking data before an exact identity match.
- Every external message requires manager approval.
- Repeated matching or approval requests must not create duplicate drafts or send twice.
- Store the sent Gmail message ID and preserve the inbound Gmail thread ID.
- Milestone 8 retry and escalation behavior remains outside this plan.

---

### Task 1: Deterministic identity-request draft and action key

**Files:**
- Create: `convex/domain/identityRequest.ts`
- Create: `convex/domain/identityRequest.test.ts`

**Interfaces:**
- Consumes: `{ caseId: string, threadId: string, recipient: string, subject: string }`.
- Produces: `identityRequestDraft(input): { actionKey: string; to: string; subject: string; text: string }`.

- [ ] **Step 1: Write failing tests** proving the draft asks for checkout email and order number, strips line breaks from the subject, prefixes `Re:` once, and returns the same action key for repeated input.
- [ ] **Step 2: Run `npm test -- --run convex/domain/identityRequest.test.ts`** and confirm failure because the module does not exist.
- [ ] **Step 3: Implement `identityRequestDraft`** with fixed safe copy and an action key in the form `identity-request:${caseId}:${threadId}`; extract no order data into the draft.
- [ ] **Step 4: Run `npm test -- --run convex/domain/identityRequest.test.ts`** and confirm all focused tests pass.

### Task 2: Create one approval on Shopify no-match

**Files:**
- Modify: `convex/shopifyData.ts`
- Modify: `convex/shopifyMatching.ts`
- Create: `convex/domain/identityApproval.test.ts`

**Interfaces:**
- Consumes: the no-match case, its source message, and `identityRequestDraft`.
- Produces: `recordNoMatchAndPrepareIdentityRequest({ caseId, detail })`, which sets `identity_needed`, creates at most one pending `customer_email` approval, and records an event containing no order data.

- [ ] **Step 1: Write failing tests** for the transition, fixed payload fields, duplicate action-key protection, and absence of customer/order/tracking fields in both approval payload and event result.
- [ ] **Step 2: Run `npm test -- --run convex/domain/identityApproval.test.ts`** and confirm the new behavior is missing.
- [ ] **Step 3: Replace the generic no-match mutation** with `recordNoMatchAndPrepareIdentityRequest`; query `approvals.by_action_key` before inserting and keep existing pending or completed approval records unchanged.
- [ ] **Step 4: Route both missing-sender-email and exact-Shopify-no-match outcomes** through the new mutation; leave connection and Shopify failures unchanged.
- [ ] **Step 5: Run the two identity test files** and confirm they pass.

### Task 3: Show the safe draft and approve it once

**Files:**
- Create: `convex/identityRequests.ts`
- Modify: `convex/gmailData.ts`
- Modify: `src/app/inbox/LiveCases.tsx`
- Modify: `src/app/inbox/page.module.css`
- Create: `convex/domain/identityExecution.test.ts`

**Interfaces:**
- Consumes: `approveAndSend({ approvalId })` from an authenticated founder or support agent and the saved approval payload.
- Produces: an outbound Gmail message, approval status `completed`, case event `identity_request_sent`, and a disabled completed state in the inbox.

- [ ] **Step 1: Write failing tests** proving pending is required, only `customer_email` identity-request payloads are accepted, completed actions cannot run again, and execution never reads Shopify order data.
- [ ] **Step 2: Run `npm test -- --run convex/domain/identityExecution.test.ts`** and confirm the execution guard is missing.
- [ ] **Step 3: Add an authenticated query** that joins each visible live case to its identity-request approval while returning only `approvalId`, `status`, `to`, `subject`, and `text`.
- [ ] **Step 4: Add `approveAndSend`** that atomically claims a pending approval as `executing`, refreshes Gmail access, replies in the stored thread, then records the provider ID and marks the approval `completed`; on Gmail failure mark it `failed` and record the safe error.
- [ ] **Step 5: Render the proposed request** on `identity_needed` rows with an `Approve and send` button; disable it while executing and after completion, and show no order section for unknown senders.
- [ ] **Step 6: Run focused tests, `npm test -- --run`, `npm run lint`, and `npm run build`** and record actual results.

### Task 4: Release and live verification

**Files:**
- Modify: `docs/superpowers/plans/2026-08-31-unknown-sender-identity-request.md`

**Interfaces:**
- Consumes: a sender absent from the connected Shopify development store.
- Produces: a deployed Milestone 7 proof with exactly one approved Gmail request and no disclosed order data.

- [ ] **Step 1: Commit only Milestone 7 files** with message `Request identity for unknown Shopify senders`.
- [ ] **Step 2: Deploy Convex production and push `main`** to start the connected Vercel deployment.
- [ ] **Step 3: Send one WISMO email from an unknown address** and verify the inbox displays the fixed draft without customer or order evidence.
- [ ] **Step 4: Approve once** and verify Gmail contains one reply in the original thread asking only for checkout email and order number.
- [ ] **Step 5: Click again or repeat the action request** and verify no second Gmail message is sent.
