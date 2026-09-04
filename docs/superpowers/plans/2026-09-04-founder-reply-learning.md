# Founder Reply And Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a founder reply from the review inbox, show the complete Gmail thread including agent clarifications, and reuse successful founder replies as examples for future agent runs.

**Architecture:** Add a pure founder-reply domain contract, a guarded Convex action that claims and sends each reply once, and a `replyExamples` table written only after Gmail success. Extend the inbox query with thread messages and extend bounded agent context with the five newest redacted founder examples.

**Tech Stack:** Next.js 16, React 19, TypeScript, Convex, Gmail API, Vitest, CSS Modules

**Spec:** `docs/design/founder-reply-learning.md`

## Global Constraints

- Only authenticated founders may send manual replies.
- A successful Gmail send must be recorded before the reply becomes a learning example.
- Retry of one client request ID must never send a second email.
- Learning examples must be redacted, bounded, and subordinate to evidence and safety policy.
- Existing inbound classification, automatic replies, and approval actions must keep working.
- `e2e-test-orders.csv` remains an untracked local test file.

---

### Task 1: Founder Reply Contract

**Files:**
- Create: `convex/domain/founderReply.ts`
- Create: `convex/domain/founderReply.test.ts`

**Interfaces:**
- Consumes: case ID, Gmail thread ID, latest customer Message-ID, recipient, subject, founder text, and client request ID.
- Produces: `founderReplyDraft(input): FounderReplyPayload` and `founderReplyHeaders(payload): string[]`.

- [ ] **Step 1: Write failing validation and header tests.** Cover blank text, text over 4,000 characters, request IDs with unsafe characters, header injection, stable action keys, and Gmail reply references.
- [ ] **Step 2: Run `npx vitest run convex/domain/founderReply.test.ts`.** Expect failure because the domain module does not exist.
- [ ] **Step 3: Implement the bounded payload.** Return `actionKey: founder-reply:{caseId}:{requestId}`, a safe `Re:` subject, trimmed text, and sanitized `In-Reply-To` / `References` headers.
- [ ] **Step 4: Run the focused test.** Expect all founder reply contract tests to pass.

### Task 2: Durable Send And Reply Example

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/founderReplies.ts`
- Modify: `convex/gmailData.ts`
- Modify: `convex/customerUpdates.ts`
- Modify: `convex/identityRequests.ts`

**Interfaces:**
- Consumes: `sendFounderReply({ caseId, text, requestId })` from an authenticated client.
- Produces: one outbound `messages` row, one completed approval, one `replyExamples` row, a resolved case, and a `founder_reply_sent` event.

- [ ] **Step 1: Add message kinds and reply-example storage.** Add optional message kind values for customer, agent clarification, agent reply, and founder reply. Add `replyExamples` with case/message/user references, customer text, reply text, and creation time.
- [ ] **Step 2: Mark existing message writes.** Label automatic clarifications, status replies, identity requests, customer updates, and inbound customer messages without changing their behavior.
- [ ] **Step 3: Implement an atomic claim.** Require a founder profile, find the newest inbound customer message in the case Gmail thread, build the payload, and insert one executing `customer_email` approval keyed by the client request ID. Return an already-completed result for a repeated request.
- [ ] **Step 4: Send through Gmail.** Refresh the stored OAuth token, call `gmail.messages.send` with the original thread ID and safe reply headers, then record the result.
- [ ] **Step 5: Finish atomically.** Insert the outbound founder message, create the reply example, complete the approval, resolve the case, and record the event. On failure, mark the approval failed and preserve the case for review.

### Task 3: Full Thread And Agent Learning Context

**Files:**
- Modify: `convex/gmailData.ts`
- Modify: `convex/agent/contracts.ts`
- Modify: `convex/agent/privacy.ts`
- Modify: `convex/agent/privacy.test.ts`
- Modify: `convex/agentRuns.ts`
- Modify: `convex/agent/openai.ts`

**Interfaces:**
- Consumes: stored `messages` by Gmail thread and successful `replyExamples`.
- Produces: `messages` ordered oldest-first on each inbox row and `founderReplyExamples` in bounded agent model context.

- [ ] **Step 1: Extend the privacy tests.** Accept at most five `{ customerMessage, founderReply }` examples, reject unknown fields or oversize text, and keep exact-key validation.
- [ ] **Step 2: Extend the context type and validator.** Add the optional bounded `founderReplyExamples` field to `AgentModelContext`.
- [ ] **Step 3: Load safe examples.** Read the five newest examples, redact both sides, bound each side to 2,000 characters, and include them in new agent runs.
- [ ] **Step 4: Update agent instructions.** Tell the agent to follow founder examples for tone and phrasing only; evidence, privacy, and action policy remain authoritative.
- [ ] **Step 5: Return complete threads.** Query `messages.by_thread`, sort oldest-first, return message kind and delivery state, and deduplicate inbox rows so the newest case represents each Gmail thread.

### Task 4: Founder Review Composer

**Files:**
- Create: `src/app/inbox/FounderReplyComposer.tsx`
- Modify: `src/app/inbox/LiveCases.tsx`
- Modify: `src/app/inbox/page.module.css`

**Interfaces:**
- Consumes: selected case ID and customer name; calls `founderReplies:sendFounderReply`.
- Produces: a complete message timeline and an accessible founder reply form with local working, success, and error feedback.

- [ ] **Step 1: Extend the inbox case type.** Add ordered messages with direction, kind, sender, recipients, body, timestamp, and delivery state.
- [ ] **Step 2: Render every message.** Replace the single source-message bubble with the ordered thread. Use customer, clarification, agent reply, and founder reply labels; preserve line breaks and timestamps.
- [ ] **Step 3: Build the composer.** Add a visible label, 4,000-character limit, character count, “reply and resolve” action, disabled sending state, and `aria-live` feedback.
- [ ] **Step 4: Keep the conversation visually primary.** Use paper surface shifts and one cobalt sender rule; do not add a card grid or a second accent color.
- [ ] **Step 5: Verify responsive behavior.** The message thread and composer must fit at 375px without horizontal scrolling; controls remain at least 44px high.

### Task 5: Verification

**Files:**
- Modify only files with defects found during verification.

**Interfaces:**
- Consumes: the complete feature.
- Produces: a release-ready local build.

- [ ] **Step 1: Run focused domain and privacy tests.** `npx vitest run convex/domain/founderReply.test.ts convex/agent/privacy.test.ts` must pass.
- [ ] **Step 2: Run the full suite.** `npm test` must pass without changing existing behavior.
- [ ] **Step 3: Run static checks.** `npm run lint` and `npx tsc --noEmit` must pass.
- [ ] **Step 4: Run the production build.** `npm run build` must finish successfully.
- [ ] **Step 5: Review the diff.** Confirm no credentials, test CSV, or unrelated files are staged.

## Self-review

- Spec coverage: founder authorization, send-once behavior, successful-send learning, clarification visibility, full thread ordering, future-agent context, and responsive UI are covered.
- Placeholder scan: no deferred implementation steps or unspecified error handling remain.
- Type consistency: `FounderReplyPayload`, `replyExamples`, `messages.kind`, and `founderReplyExamples` names are consistent across domain, Convex, agent, and UI tasks.
