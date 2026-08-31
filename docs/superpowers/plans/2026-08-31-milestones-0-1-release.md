# Milestones 0–1 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a tested WISMO landing-to-sign-in path and a sample human-attention inbox today.

**Architecture:** Keep the existing public landing page and real `/connect` authentication entry. Keep `/inbox` as a static sample route so Milestone 1 does not depend on unfinished backend workflows.

**Tech Stack:** Next.js 16, React 19, CSS Modules, Convex Auth, Vercel

**Spec:** `../milestones.md`, milestones 0 and 1 only

## Global Constraints

- Only Must-have Milestones 0 and 1 are in scope.
- External messages and Shopify changes require manager approval.
- Sample data must be labeled honestly.

---

### Task 1: Verify the two acceptance paths

**Files:**
- Verify: `src/app/page.tsx`
- Verify: `src/app/support-web/SupportWorld.tsx`
- Verify: `src/app/connect/page.tsx`
- Verify: `src/app/connect/RealSetupJourney.tsx`
- Verify: `src/app/inbox/page.tsx`

**Interfaces:**
- Consumes: `/`, `/connect`, and `/inbox` Next.js routes
- Produces: two demonstrable flows matching milestones 0 and 1

- [x] **Step 1: Run the automated checks**

Run `npm run lint`, `npm run test`, and `npm run build`.

- [x] **Step 2: Run the production server**

Run `npm run start` against the completed build.

- [x] **Step 3: Verify route responses and copy**

Request `/`, `/connect`, and `/inbox`; confirm successful responses and confirm the landing CTA says `Connect support mailbox`, while the inbox contains `Customer`, `Reason`, `Recommendation`, and `Deadline`.

### Task 2: Publish and verify

**Files:**
- Publish: the tested working tree required for milestones 0 and 1

**Interfaces:**
- Consumes: GitHub repository and connected Vercel project
- Produces: public production routes for `/`, `/connect`, and `/inbox`

- [ ] **Step 1: Check the release diff**

Run `git diff --check` and inspect the exact staged files so unrelated user work is not discarded.

- [ ] **Step 2: Commit and push the tested MVP**

Commit with `Ship WISMO milestones 0 and 1`, then push `main` to `origin` so the connected production deployment starts.

- [ ] **Step 3: Verify the public deployment**

Open the production URL signed out and confirm `/`, `/connect`, and `/inbox` load. Confirm the landing CTA reaches Google sign-in and the inbox shows all five required case fields.
