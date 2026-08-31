# Shopify Customer Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Milestone 6 by matching a clear WISMO sender to one Shopify customer and showing that customer’s active orders, fulfillment state, and tracking in the live inbox.

**Architecture:** A pure adapter validates and normalizes Shopify GraphQL results. Each newly created WISMO case schedules a server-side match using the encrypted Shopify connection; a single Convex mutation saves the customer and order snapshots, links the case, and records the evidence. The inbox reads only saved snapshots, so Shopify credentials and raw API responses never reach the browser.

**Tech Stack:** TypeScript, Convex actions and database, Shopify Admin GraphQL API 2026-07, React, Vitest

**Spec:** `milestones.md` Milestone 6 and the Must Have rows “Match sender to a Shopify customer” and “Retrieve Shopify orders, fulfillment, and tracking.”

## Global Constraints

- Match only the exact normalized sender email in this milestone.
- Never expose an order when no exact customer match exists.
- Fetch at most 10 newest open orders and at most 10 line items, fulfillments, and tracking entries per order.
- Store only the fields already represented by the `customers` and `orders` tables.
- Keep Shopify credentials encrypted and server-side.
- Record the match, no-match, missing-connection, and Shopify-error outcomes in the case event log.

---

### Task 1: Shopify response adapter

**Files:**

- Create: `convex/domain/shopifyCustomer.ts`
- Create: `convex/domain/shopifyCustomer.test.ts`

**Interfaces:**

- Consumes: unknown JSON from `customerByIdentifier(identifier: { emailAddress })` containing `orders(first: 10, reverse: true, query: "status:open")`.
- Produces: `parseShopifyCustomer(value): ShopifyCustomerSnapshot | null`, where each order includes its Shopify ID, name, creation time, line-item titles, fulfillment display state, and first available tracking number and URL.

- [x] Write failing tests for exact customer data, multiple fulfillments, missing tracking, no customer, and GraphQL errors.
- [x] Run the focused test and confirm the adapter is missing.
- [x] Implement strict parsing with safe defaults for optional fulfillment and tracking fields.
- [x] Run the focused tests and confirm they pass.

### Task 2: Match and persist a received case

**Files:**

- Create: `convex/shopifyData.ts`
- Create: `convex/shopifyMatching.ts`
- Modify: `convex/gmailData.ts`

**Interfaces:**

- Consumes: `matchCase({ caseId })`, the case source message, and the encrypted Shopify integration.
- Produces: upserted customer and order snapshots, `cases.customerId`, an `orderId` only when one active order exists, status `investigating` for a match or `identity_needed` for no match, and an audit event.

- [x] Add internal reads for the case, source message, and Shopify connection.
- [x] Add one transactional mutation to upsert the customer and orders and attach them to the case.
- [x] Add the Shopify action using `customerByIdentifier` with the official `emailAddress` identifier and server-side decrypted token.
- [x] Schedule the action after a clear WISMO case is created; store safe events for missing connection and API failure.

### Task 3: Show saved Shopify evidence

**Files:**

- Modify: `convex/gmailData.ts`
- Modify: `src/app/inbox/LiveCases.tsx`
- Modify: `src/app/inbox/page.module.css`

**Interfaces:**

- Consumes: active live cases joined with their saved customer and orders.
- Produces: inbox rows that show exact sender match, active-order number, item, fulfillment, and tracking without querying Shopify from the browser.

- [x] Extend the live-case query across received, investigating, and identity-needed states.
- [x] Render a pending state, exact-match evidence, or safe no-match state.
- [x] Run formatting, lint, focused tests, all tests, TypeScript, and the production build.
- [ ] Deploy Convex and Vercel, then demonstrate a sender that exists in the connected Shopify store.

**Deferred live proof (31 Aug 2026):** Convex and Vercel deployed successfully from commit `b56b2a2`. The remaining real-account check is to send a WISMO email from an address that exactly matches a Shopify customer, poll Gmail, and confirm the inbox shows only that customer's saved active-order evidence. The user chose to run this check later.
