# Inbox Active Automation and History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the disabled Active automation and History navigation items into useful, authenticated inbox views.

**Architecture:** Add two Convex queries that return safe, compact projections from existing cases, agent runs, steps, approvals, and messages. Add client routes that reuse the inbox visual language and link back to each case; keep raw prompts, tool arguments, and customer data out of the automation list.

**Tech Stack:** Next.js App Router, React, Convex queries, CSS modules, Vitest.

**Spec:** `docs/design/inbox-conversation-review-repair.md` and `docs/design/inbox-observability.md`

## Global Constraints

- Active automation shows queued/running/waiting work only; completed work belongs in History.
- History shows closed cases and the delivered conversation outcome.
- Use existing authentication and Convex data; do not fabricate product history.
- Keep the UI calm and evidence-led; no raw model reasoning or sensitive payloads.

### Task 1: Add safe Convex list projections

**Files:**
- Create: `convex/inboxViews.ts`
- Test: `convex/inboxViews.test.ts`

- [ ] Add `activeAutomation` query returning run id, case id, status, trigger, round, timestamps, and step summaries for runs in queued/running/waiting states.
- [ ] Add `history` query returning closed cases with source subject/sender, resolved timestamp, outcome label, message count, and last delivered outbound message preview.
- [ ] Require authentication and cap both lists at 50 rows.
- [ ] Test status filtering, newest-first ordering, and safe projections.

### Task 2: Build Active automation route

**Files:**
- Create: `src/app/inbox/automation/page.tsx`
- Create: `src/app/inbox/automation/page.module.css`

- [ ] Render loading, empty, and error-safe states.
- [ ] Render each run’s status, trigger, current step, and elapsed time.
- [ ] Link case-backed runs to `/inbox?case=<id>` and provide a return link to Inbox.

### Task 3: Build History route

**Files:**
- Create: `src/app/inbox/history/page.tsx`
- Create: `src/app/inbox/history/page.module.css`

- [ ] Render closed cases newest first with outcome, recipient, resolved time, and delivered reply preview.
- [ ] Link each row to the existing case detail route where available and back to Inbox.
- [ ] Render an honest empty state when no cases are closed.

### Task 4: Activate navigation and verify

**Files:**
- Modify: `src/app/inbox/page.tsx`
- Modify: `src/app/inbox/page.module.css`

- [ ] Replace disabled spans with links and active-route styling.
- [ ] Run `npm test`, `npx tsc --noEmit`, and `npm run lint`.
- [ ] Check responsive layout and record that browser/Convex deployment testing remains outstanding if not available.
