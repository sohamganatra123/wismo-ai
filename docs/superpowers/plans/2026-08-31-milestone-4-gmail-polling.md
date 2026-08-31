# Milestone 4 Gmail Polling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poll the connected Gmail test inbox and create one saved WISMO case containing the original email text and Gmail conversation ID.

**Architecture:** Gmail OAuth saves the mailbox history cursor at connection time. A Convex cron polls Gmail history every minute, refreshes the access token, fetches new inbox messages, and passes normalized messages to one idempotent database mutation. An authenticated inbox panel shows received cases and offers a manual poll for a fast demo.

**Tech Stack:** Convex actions, mutations, queries, and cron jobs; Gmail REST API; Next.js 16; React 19; Vitest

**Spec:** `../milestones.md`, milestone 4 only

## Global Constraints

- Store the original email text and Gmail thread ID.
- Reprocessing one Gmail message must not create a second message or case.
- Poll only the founder-connected test inbox.
- Do not classify the request, match Shopify, or send any email in this milestone.

---

### Task 1: Normalize Gmail messages

**Files:**
- Create: `convex/domain/gmail.ts`
- Test: `convex/domain/gmail.test.ts`

**Interfaces:**
- Produces: `normalizeGmailMessage(payload)` returning provider ID, thread ID, headers, plain text, labels, and timestamp

- [x] Decode Gmail base64url bodies, prefer `text/plain`, fall back to stripped HTML, and parse repeated recipient headers.
- [x] Test plain text, nested multipart, HTML fallback, and missing headers.

### Task 2: Poll and persist

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/integrationData.ts`
- Modify: `convex/integrations.ts`
- Create: `convex/gmailData.ts`
- Create: `convex/gmailPolling.ts`
- Create: `convex/crons.ts`

**Interfaces:**
- Consumes: encrypted Gmail refresh token and saved history cursor
- Produces: one `messages` row, one `cases` row, and one `events` row per new inbox message

- [x] Save Gmail `historyId` during OAuth connection.
- [x] Refresh Gmail access, read new history pages, fetch full messages, and ignore non-inbox labels.
- [x] Insert message and case in one idempotent mutation keyed by Gmail message ID.
- [x] Advance the cursor only after processing and run the poll every minute.

### Task 3: Show received cases

**Files:**
- Create: `src/app/inbox/layout.tsx`
- Create: `src/app/inbox/LiveCases.tsx`
- Modify: `src/app/inbox/page.tsx`
- Modify: `src/app/inbox/page.module.css`

**Interfaces:**
- Consumes: authenticated `gmailData:listReceivedCases` query and `gmailPolling:pollNow` action
- Produces: live received-case panel showing sender, subject, original text, Gmail thread ID, and manual poll state

- [x] Show connection/loading/empty/error states without hiding the sample inbox.
- [x] Disable the manual poll while it runs and report how many cases were created.

### Task 4: Verify and publish

- [x] Run lint, tests, typecheck, and production build.
- [ ] Deploy Convex functions and push the web release.
- [ ] Connect the test inbox, send one sample email, poll, and confirm one case appears with its original text and Gmail thread ID.
