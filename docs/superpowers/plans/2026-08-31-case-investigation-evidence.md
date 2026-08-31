# Case Investigation Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a manager run an investigation and see the case's previous emails, selected Shopify order, fulfillment state, and newest valid tracking update.

**Architecture:** A pure domain function will validate and assemble investigation evidence without database dependencies. A Convex action will load the selected case context, run that collector, record an audit event, and return the saved snapshot; the live inbox will expose the action and render its result.

**Tech Stack:** TypeScript, Convex, React 19, Next.js 16, Vitest

**Spec:** `../milestones.md`, Milestone 11; tracking safety rules in `../scoping.md`, steps 8, 11, 12, 13, and 14

## Global Constraints

- Use only messages belonging to the matched customer; do not expose another customer's history.
- Use the case's selected Shopify order.
- Accept tracking scans only when their tracking number exactly matches the selected order.
- Sort scans by recorded event time and use the newest valid scan.
- Record the evidence collection in the case event log.
- Do not send a customer message or perform a Shopify update in this milestone.

---

### Task 1: Investigation evidence collector

**Files:**
- Create: `convex/domain/investigation.ts`
- Test: `convex/domain/investigation.test.ts`

**Interfaces:**
- Consumes: a selected order, customer-owned previous messages, and tracking scans.
- Produces: `collectInvestigationEvidence(input): InvestigationEvidence` and an explicit failure when the case has no selected order.

- [ ] **Step 1: Write failing tests**

Test that the collector sorts previous messages newest-first, returns order and fulfillment details, selects the newest exact-match scan, rejects mismatched scans, and rejects a missing selected order.

- [ ] **Step 2: Run the focused test**

Run: `npm test -- --run convex/domain/investigation.test.ts`
Expected: FAIL because `collectInvestigationEvidence` does not exist.

- [ ] **Step 3: Implement the pure collector**

Define serializable input and result types. Reuse `chooseNewestMatchingScan` so exact tracking-number matching and date validation remain in one place.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --run convex/domain/investigation.test.ts`
Expected: PASS.

### Task 2: Persisted investigation action

**Files:**
- Create: `convex/investigations.ts`
- Modify: `convex/schema.ts`

**Interfaces:**
- Consumes: `collectInvestigationEvidence`, authenticated `caseId`, case/customer/order/message/tracking records.
- Produces: public action `investigations:run` returning the evidence snapshot.

- [ ] **Step 1: Add an `investigations` table**

Store `caseId`, source message IDs, selected order ID, fulfillment state, newest scan fields, and `collectedAt`; index by case.

- [ ] **Step 2: Load only safe case context**

Require authentication. Require a matched customer and selected order. Include prior customer messages only when their stored `caseId` belongs to that same customer.

- [ ] **Step 3: Save the snapshot and audit event**

Replace the prior snapshot for the case, add an `investigation_completed` event, and leave the case in `investigating` state.

- [ ] **Step 4: Regenerate Convex types**

Run: `npx convex codegen`
Expected: generated API and data-model types include `investigations`.

### Task 3: Ten-second milestone proof

**Files:**
- Modify: `src/app/inbox/LiveCases.tsx`
- Modify: `src/app/inbox/page.module.css`

**Interfaces:**
- Consumes: `investigations:run`.
- Produces: a per-case “Run investigation” control and evidence panel.

- [ ] **Step 1: Add the action state**

Track the active case and evidence by case ID, disable repeat taps while running, and show the backend error in the existing live feedback region.

- [ ] **Step 2: Render collected evidence**

Show previous email count and excerpts, order name and products, fulfillment state, and newest tracking status/time/location. Say clearly when no matching tracking update exists.

- [ ] **Step 3: Verify the complete change**

Run: `npm test` and `npm run build`
Expected: all tests pass and the production build completes.

