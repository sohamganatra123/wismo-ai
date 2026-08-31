# Milestones 2–3 Case Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a manager open a sample human-attention case, inspect its complete context, and approve, override, or guide the proposed action without duplicate submissions.

**Architecture:** A shared static fixture supplies both inbox rows and case detail so the sample stays consistent. The detail page remains server-rendered, while one small client component owns only the decision form and its working/success state.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, Vitest

**Spec:** `../milestones.md`, milestones 2 and 3 only

## Global Constraints

- The case detail must show customer, order, tracking, previous messages, agent steps, and linked cases.
- The manager can approve, override, or add guidance.
- A processing state must disable every decision control to prevent a double-tap.
- The flow uses clearly labeled sample data and performs no external action.

---

### Task 1: Shared sample case model

**Files:**
- Create: `src/app/inbox/caseData.ts`
- Modify: `src/app/inbox/page.tsx`

**Interfaces:**
- Produces: `cases`, `CaseRecord`, and `getCase(caseId)` for inbox and detail routes

- [x] **Step 1: Define the complete Amina case fixture**

Include profile, order, tracking, messages, agent steps, related cases, reason, deadline, and recommendation in one typed object.

- [x] **Step 2: Link inbox rows to `/inbox/[caseId]`**

Use semantic Next.js links and preserve every Milestone 1 field.

### Task 2: Case detail workspace

**Files:**
- Create: `src/app/inbox/[caseId]/page.tsx`
- Create: `src/app/inbox/[caseId]/page.module.css`
- Create: `src/app/inbox/[caseId]/CaseActions.tsx`

**Interfaces:**
- Consumes: `getCase(caseId)`
- Produces: public sample case-detail route and local manager-decision simulation

- [x] **Step 1: Render all required case evidence**

Show the open customer question, identity, order, newest tracking state, previous messages, numbered agent steps, and related cases.

- [x] **Step 2: Add approve, override, and guidance controls**

Keep one selected action, require text for override or guidance, and label the simulation honestly.

- [x] **Step 3: Block duplicate submission**

On submit, set `processing` immediately, disable all controls, then show one completion receipt without sending a message.

### Task 3: Verify and publish

**Files:**
- Verify: `src/app/inbox/**/*`

**Interfaces:**
- Produces: demonstrable Milestones 2 and 3 on the public MVP

- [x] **Step 1: Run `npm run lint`, `npm run test`, and `npm run build`**

- [ ] **Step 2: Verify `/inbox/WIS-1048` contains every required section**

- [ ] **Step 3: Commit, push, and verify the public Vercel route**
