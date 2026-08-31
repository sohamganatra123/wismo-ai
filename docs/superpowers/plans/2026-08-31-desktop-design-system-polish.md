# Desktop Design System Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the desktop hierarchy and shared UI foundations without changing the deferred mobile structure.

**Architecture:** Promote repeated colors, shadows, and control states into global semantic tokens. Clarify the inbox into live intake and demo evidence, then apply one readable type floor and one control-state contract across inbox, case review, and founder setup.

**Tech Stack:** Next.js 16, React 19, CSS Modules

**Spec:** `.interface-design/system.md` and the 31 Aug 2026 design review

## Global Constraints

- Do not reorder or redesign mobile layouts in this pass.
- Preserve the WISMO evidence-route signature.
- Use a 12px minimum for operational text and 48px minimum for controls.
- Use shared semantic tokens instead of screen-local duplicate colors.

---

### Task 1: Shared foundations

- [x] Add semantic attention, danger, tertiary-text, border, control, and card-shadow tokens to `src/app/globals.css`.
- [x] Add shared hover, press, focus, and disabled behavior without `transition: all`.

### Task 2: Inbox hierarchy

- [x] Replace the fixed three-case headline with a stable task headline.
- [x] Give signed-out users a visible sign-in action.
- [x] Present live Gmail intake first and label sample cases as demo data.
- [x] Raise operational metadata to the readable type floor.

### Task 3: Case review and setup consistency

- [x] Apply shared tokens and readable text sizes to evidence, history, recommendation, and decision controls.
- [x] Raise setup controls to 48px and add complete interaction states.

### Task 4: Verify

- [x] Run lint, tests, typecheck, and production build.
- [x] Capture desktop inbox and case screenshots and run the hierarchy, signature, token, and squint checks.
- [x] Publish and verify the production routes.
