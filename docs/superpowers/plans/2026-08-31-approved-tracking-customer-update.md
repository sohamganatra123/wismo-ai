# Approved Tracking Customer Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare a customer tracking update from confirmed evidence within two minutes and send it once only after manager approval.

**Architecture:** A pure domain module will turn an exact-match newest tracking scan into a safe reply payload and validate whether a pending approval can be claimed. The investigation mutation will create that approval idempotently; a separate Gmail action will atomically claim, send, and record it. The live inbox will show the draft and provide a guarded approval button.

**Tech Stack:** TypeScript, Convex, React 19, Next.js 16, Vitest, Gmail API

**Spec:** `../milestones.md`, Milestone 12; `../scoping.md`, steps 13–15 and approval requirements

## Global Constraints

- The tracking number must exactly match the selected Shopify order.
- The newest valid tracking event must be used.
- Nothing is sent automatically.
- A manager must approve the prepared customer update.
- A repeated click must not send a duplicate message.
- The first prepared action must be created no later than two minutes after confirmed evidence is collected.
- The sent email must remain in the original Gmail thread.

---

### Task 1: Safe update draft

**Files:**
- Create: `convex/domain/customerUpdate.ts`
- Test: `convex/domain/customerUpdate.test.ts`

**Interfaces:**
- Consumes: case/thread/message headers, customer recipient, order name, fulfillment, order tracking number, and newest scan.
- Produces: `customerUpdateDraft(input): CustomerUpdatePayload`, `customerUpdateHeaders(payload)`, and `claimableCustomerUpdate(approval)`.

- [ ] **Step 1: Test exact matching and safe copy**

Assert that mismatched tracking throws, valid evidence produces a reply containing the order and newest status, headers preserve a valid thread reference, and an already handled approval cannot be claimed.

- [ ] **Step 2: Run the focused test**

Run: `npm test -- --run convex/domain/customerUpdate.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the domain helpers**

Sanitize subject and message header newlines, create a stable `tracking-update:<caseId>:<eventTime>` key, and keep customer text limited to selected-order delivery evidence.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --run convex/domain/customerUpdate.test.ts`
Expected: PASS.

### Task 2: Pending approval creation

**Files:**
- Modify: `convex/investigations.ts`
- Modify: `convex/gmailData.ts`

**Interfaces:**
- Consumes: `customerUpdateDraft` and confirmed investigation evidence.
- Produces: one pending `customer_email` approval returned by `gmailData:listReceivedCases` as `customerUpdate`.

- [ ] **Step 1: Create the approval during investigation**

When and only when `latestTracking` exists, read the source message, build the reply, look up its stable action key, and insert it only when absent.

- [ ] **Step 2: Record timing**

Use the same timestamp as the completed investigation, set `firstActionAt` only when empty, and include `preparedWithinTwoMinutes: true` in the audit result because preparation occurs in the same transaction as evidence collection.

- [ ] **Step 3: Return the draft in the live-case query**

Expose approval ID, status, recipient, subject, text, and proposed time without exposing credentials.

### Task 3: Approved Gmail execution

**Files:**
- Create: `convex/customerUpdates.ts`

**Interfaces:**
- Consumes: a pending update approval and connected Gmail credentials.
- Produces: `customerUpdates:approveAndSend({ approvalId })` returning `{ status: "sent" }`.

- [ ] **Step 1: Add read and claim operations**

Require a signed-in manager profile and atomically change only a pending, valid tracking update from `pending` to `executing`.

- [ ] **Step 2: Send through Gmail**

Refresh the OAuth token, build reply headers, call `gmail.messages.send` with the original thread ID, then save the outbound message and mark approval completed.

- [ ] **Step 3: Record failures**

Mark the approval failed and add an error event when Gmail rejects the send; do not silently retry in the button action.

### Task 4: Manager approval UI

**Files:**
- Modify: `src/app/inbox/LiveCases.tsx`
- Modify: `src/app/inbox/page.module.css`

**Interfaces:**
- Consumes: `customerUpdate` from the live query and `customerUpdates:approveAndSend`.
- Produces: an approval card with draft copy, proposed time, disabled processing state, and final sent state.

- [ ] **Step 1: Add action state**

Call the action from an event handler and keep the active approval ID in state so repeat taps are blocked without an effect or extra render subscription.

- [ ] **Step 2: Render the approval boundary**

Label the message “Approval required,” show the full customer draft, and use “Approve and send” only while pending.

- [ ] **Step 3: Verify all layers**

Run: `npm test`, `npx tsc --noEmit --pretty false`, and `npm run build`.
Expected: all tests pass, TypeScript reports no errors, and the production build completes.

