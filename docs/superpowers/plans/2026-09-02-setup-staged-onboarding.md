# Setup Staged Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/setup` into a real staged founder onboarding flow that uses the existing live setup actions and can be verified with automated checks.

**Architecture:** Keep the existing Convex actions and mutations as the source of truth for Gmail, Shopify, team, contacts, rules, and memories. Add a small client-side setup-progress layer for stage selection, local activation state, and honest gating so the UI becomes a sequential onboarding journey instead of an unstructured settings page.

**Tech Stack:** Next.js App Router, React, TypeScript, Convex, CSS Modules, Vitest

**Spec:** `docs/design/real-onboarding-journey-repair.md`

## Global Constraints

- Preserve `/connect` as the public one-field early-access form.
- Reuse real Gmail and Shopify setup actions; do not replace them with fake network steps.
- Keep user-facing copy honest about what is real today and what is still manager-controlled.
- Do not break support-agent access to `/setup`.
- Use keyboard-accessible controls and preserve mobile behavior.
- Add tests for new stage logic and any new local storage helper.

---

### Task 1: Stage Model And Persistence

**Files:**
- Create: `src/app/connect/setupJourney.ts`
- Create: `src/app/connect/setupJourney.test.ts`
- Create: `src/app/connect/setupStorage.ts`
- Create: `src/app/connect/setupStorage.test.ts`

**Interfaces:**
- Produces: `setupStages`, `deriveSetupProgress(input)`, and `firstIncompleteStage(progress)`.
- Produces: `loadSetupDraft()` and `saveSetupDraft(draft)`.

- [ ] Define the stage ids, labels, and completion rules.
- [ ] Add pure tests for gating and first-incomplete-stage behavior.
- [ ] Add local-storage helpers for mode, confirmations, and activation.
- [ ] Add storage tests that prove unsafe values fall back safely.

### Task 2: Founder Journey UI

**Files:**
- Modify: `src/app/connect/RealSetupJourney.tsx`
- Modify: `src/app/connect/setup.module.css`

**Interfaces:**
- Consumes: `deriveSetupProgress`, `loadSetupDraft`, `saveSetupDraft`.
- Produces: a staged founder-only `/setup` flow with rail, step content, and activation receipt.

- [ ] Replace the founder settings layout with a staged onboarding shell.
- [ ] Reuse the current Gmail, Shopify, invite, contact, rule, and memory components inside the right stages.
- [ ] Add honest readiness and activation steps that only unlock when earlier steps are complete.
- [ ] Preserve the current sign-in and support-agent branches.

### Task 3: Verification

**Files:**
- Modify only if validation uncovers issues.

**Interfaces:**
- Validates: staged setup logic and production compile.

- [ ] Run targeted Vitest coverage for the new setup helpers.
- [ ] Run `npm test` to catch regressions.
- [ ] Run `npm run build` if the environment allows it.
