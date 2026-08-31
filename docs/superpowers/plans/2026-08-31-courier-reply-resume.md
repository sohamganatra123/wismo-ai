# Courier Reply Resume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match a courier reply to the correct waiting case, resume it, and require manager approval before applying the proposed Shopify note and customer update.

**Architecture:** Pure matching code validates courier identity, thread, tracking number, and event time. A Convex mutation records the reply and proposals atomically. Existing customer-email approval execution is reused; a Shopify action applies the approved order note through GraphQL.

**Tech Stack:** TypeScript, Convex, React 19, Next.js 16, Vitest, Gmail and Shopify GraphQL APIs

**Spec:** `../milestones.md`, Milestones 13–14; `../scoping.md`, steps 13–18

## Global Constraints

- Match the configured active courier email and the recorded Gmail thread.
- Reject a courier tracking number unless it exactly matches the selected Shopify order.
- Use only a valid event timestamp.
- Never update delivery dates, addresses, or delivery arrangements.
- Propose a customer email and Shopify order note separately.
- Perform neither proposal before manager approval.
- Stable action keys prevent duplicate proposals and execution.

---

### Task 1: Courier reply matcher

**Files:**
- Create: `convex/domain/courierReply.ts`
- Test: `convex/domain/courierReply.test.ts`

**Interfaces:**
- Consumes: configured contact, waiting thread, selected-order tracking, and parsed reply fields.
- Produces: `matchCourierReply(input)` returning a normalized scan or a safe rejection reason.

- [ ] Test exact sender, thread, tracking, and valid event-time checks.
- [ ] Run `npm test -- --run convex/domain/courierReply.test.ts`; expect failure before implementation.
- [ ] Implement normalization with no fuzzy identity or tracking matches.
- [ ] Re-run the focused test; expect pass.

### Task 2: Waiting case and reply proposals

**Files:**
- Create: `convex/courierReplies.ts`
- Modify: `convex/gmailData.ts`

**Interfaces:**
- Consumes: case, active courier contact, selected order, and reply fields.
- Produces: a recorded contact attempt, courier message, tracking scan, pending customer email, and pending Shopify note.

- [ ] Add `prepareWaitingCase` to create one contact attempt and set `awaiting_courier`.
- [ ] Add `receiveSimulated` for the milestone proof using the same strict matcher intended for Gmail polling.
- [ ] Insert proposals by stable action key and move the case to `awaiting_approval`.
- [ ] Expose courier state and Shopify proposal in `listReceivedCases`.

### Task 3: Approved Shopify note

**Files:**
- Create: `convex/shopifyNotes.ts`
- Test: `convex/domain/shopifyNote.test.ts`
- Create: `convex/domain/shopifyNote.ts`

**Interfaces:**
- Consumes: pending `shopify_note` approval, connected Shopify credentials, selected order global ID.
- Produces: one authenticated Shopify `orderUpdate` call and completed or failed approval state.

- [ ] Test payload validation and one-time claim rules.
- [ ] Implement the authenticated action with atomic claim before GraphQL.
- [ ] Record success or failure in the event log.

### Task 4: Ten-second manager proof

**Files:**
- Modify: `src/app/inbox/LiveCases.tsx`
- Modify: `src/app/inbox/page.module.css`

**Interfaces:**
- Consumes: courier mutations, live proposals, existing customer send, and Shopify note action.
- Produces: “Wait for courier,” “Simulate reply,” and separate approval controls.

- [ ] Keep network calls in click handlers and disable only the active operation.
- [ ] Show matched reply evidence before both proposals.
- [ ] Run `npm test`, `npx tsc --noEmit --pretty false`, and `npm run build`; expect all pass.

