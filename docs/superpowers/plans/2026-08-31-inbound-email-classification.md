# Inbound Email Classification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Milestone 5 by rejecting unrelated inbox mail and replying once with a safe clarification request when a likely WISMO email has no usable question.

**Architecture:** A pure classifier decides whether an inbound message is a clear WISMO request, an unclear WISMO request, or unrelated. The Gmail poller applies that decision before case creation; unclear requests are stored for audit, receive a reply in the same Gmail thread, and are not exposed as ready cases.

**Tech Stack:** TypeScript, Convex, Gmail REST API, Vitest

**Spec:** `milestones.md` Milestone 5 and the Must Have rows “Detect WISMO requests” and “Ask for clarification on empty or unclear emails.”

## Global Constraints

- Never create a case for unrelated email.
- Never disclose order or customer information in a clarification request.
- Deduplicate using the inbound Gmail message ID before sending any response.
- Keep the reply in the original Gmail thread.
- Record the inbound message and clarification event for audit.

---

### Task 1: Deterministic inbound classifier

**Files:**

- Create: `convex/domain/inboundClassification.ts`
- Test: `convex/domain/inboundClassification.test.ts`

**Interfaces:**

- Consumes: normalized Gmail `subject` and `text` strings.
- Produces: `classifyInboundEmail(input): "wismo" | "clarification" | "unrelated"`.

- [x] Write tests for clear delivery questions, empty delivery subjects, vague delivery messages, unrelated mail, and common WISMO wording.
- [x] Run the focused test and confirm it fails before implementation.
- [x] Implement the smallest deterministic classifier that passes those cases.
- [x] Run the focused test and confirm it passes.

### Task 2: Safe clarification workflow

**Files:**

- Modify: `convex/gmailData.ts`
- Modify: `convex/gmailPolling.ts`
- Test: `convex/domain/inboundClassification.test.ts`

**Interfaces:**

- Consumes: classifier result and normalized Gmail message.
- Produces: an ignored result for unrelated mail, the existing received case for clear WISMO mail, or a single thread-safe clarification reply for unclear WISMO mail.

- [x] Add a preflight mutation that deduplicates the provider message ID and records the classification outcome.
- [x] Add Gmail send support using a URL-safe base64 RFC 2822 reply with `threadId`, `In-Reply-To`, and `References` headers.
- [x] Record the outbound clarification message and case event only after Gmail accepts it.
- [x] Ensure polling counts created cases and clarification replies separately.

### Task 3: Operator feedback and verification

**Files:**

- Modify: `src/app/inbox/LiveCases.tsx`

**Interfaces:**

- Consumes: poll result counts for checked messages, created cases, clarification replies, and ignored messages.
- Produces: plain operator feedback that explains what the poll did.

- [x] Show all poll outcomes without presenting ignored mail as a case.
- [x] Run lint, all tests, TypeScript, and the production build.
- [ ] Deploy and demonstrate one unrelated email and one empty or unclear WISMO email against the test inbox.
