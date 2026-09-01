# Agentic WISMO Onboarding Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/connect` into a five-stage journey where a Shopify founder briefs WISMO, equips it with evidence, teaches its voice, watches one investigation, and chooses a saved control level.

**Architecture:** Keep the existing six-state reducer so Gmail and Shopify can fail and retry independently, but map both states to one visible Evidence stage. Add typed journey content and a saved autonomy mode, migrate local storage from v2 to v3, and compose the current simulated adapters into a persistent agent-status shell. The completion receipt links directly to the evidence desk and can return to Control so the choice is genuinely editable.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript, CSS Modules, Vitest

**Spec:** `docs/design/agentic-onboarding-journey.md`

## Global Constraints

- Visible journey order is Brief → Evidence → Voice → Proof → Control.
- Gmail and Shopify remain separate reducer states but share visible stage 02.
- Default control mode is `approval`; users may select `investigate`, `approval`, or `verified`.
- State choices persist locally without storing the password.
- Existing simulated adapters and their failure behavior remain unchanged.
- `/connect` must state that no external account or message changed.
- Use Archivo and IBM Plex Mono with paper, ink, kraft, and cobalt.
- Keep all controls at least 44×44px, inputs at 16px, visible focus, native semantics, and reduced-motion support.
- Do not add a component, icon, or animation dependency.

---

### Task 1: Define the five-stage journey and autonomy contract

**Files:**
- Create: `src/app/connect/onboardingContent.ts`
- Create: `src/app/connect/onboardingContent.test.ts`
- Modify: `src/app/connect/onboardingTypes.ts`
- Modify: `src/app/connect/onboardingReducer.ts`
- Modify: `src/app/connect/onboardingReducer.test.ts`

**Interfaces:**
- Produces `JourneyStageId`, `journeyStages`, `stageForStep(step)`, `agentStatusForState(state)`, and `autonomyModes`.
- Adds `AutonomyMode = "investigate" | "approval" | "verified"`, `autonomyMode` to `OnboardingState`, and `AUTONOMY_SELECTED` / `EDIT_AUTONOMY` actions.

- [ ] **Step 1: Write failing content and reducer tests.** Assert five visible stages, Gmail and Shopify both mapping to Evidence, the six agent status labels, default `approval`, selectable modes, and return-to-Control behavior.
- [ ] **Step 2: Run focused tests.** Run `npm test -- src/app/connect/onboardingContent.test.ts src/app/connect/onboardingReducer.test.ts`. Expected: FAIL because the content module and autonomy actions do not exist.
- [ ] **Step 3: Add typed journey content.** Define stages `brief`, `evidence`, `voice`, `proof`, and `control`, with reducer targets `account`, `gmail`, `voice`, `test`, and `launch`. Define the three control modes with plain-language summaries and mark `approval` recommended.
- [ ] **Step 4: Add autonomy state and reducer actions.** Initialize `autonomyMode: "approval"`; `AUTONOMY_SELECTED` updates it and clears `active`; `EDIT_AUTONOMY` returns an active setup to `launch` and clears `active` without resetting evidence.
- [ ] **Step 5: Run focused tests.** Expected: PASS.

---

### Task 2: Migrate saved onboarding state safely

**Files:**
- Modify: `src/app/connect/onboardingStorage.ts`
- Modify: `src/app/connect/onboardingStorage.test.ts`

**Interfaces:**
- Produces `ONBOARDING_STORAGE_KEY = "wismo:onboarding:v3"`.
- Reads valid v3 state and migrates valid `wismo:onboarding:v2` state with `autonomyMode: "approval"`.

- [ ] **Step 1: Write failing storage tests.** Assert v3 round-trip, password absence, autonomy persistence, and v2 migration to approval.
- [ ] **Step 2: Run `npm test -- src/app/connect/onboardingStorage.test.ts`.** Expected: FAIL on version and migration assertions.
- [ ] **Step 3: Implement validation and migration.** Validate the autonomy value, read v3 first, fall back to v2, merge with `initialOnboardingState`, and remove both keys in `clearOnboarding()`.
- [ ] **Step 4: Run the storage tests.** Expected: PASS.

---

### Task 3: Compose the agentic journey

**Files:**
- Replace: `src/app/connect/OnboardingJourney.tsx`

**Interfaces:**
- Consumes journey content, reducer state, storage, and existing adapters.
- Produces one persistent agent-status shell and five visible stages.

- [ ] **Step 1: Replace the six-step wizard navigation.** Render `WISMO.ai`, `AGENT BRIEF`, five manifest rows, text states `CURRENT` / `VERIFIED` / `LOCKED`, and a persistent agent-status panel with `aria-live="polite"`.
- [ ] **Step 2: Reframe Account as Brief.** Use `01 · Brief`, show the fixed WISMO mission and safety boundary, keep name/email/password validation, and state that the password is never stored.
- [ ] **Step 3: Merge Gmail and Shopify into Evidence.** Keep Gmail permissions and Shopify URL validation as separate source rows in one stage. After Gmail connects, replace its action with a `VERIFIED` receipt and reveal Shopify without a full page transition.
- [ ] **Step 4: Reframe Voice and Proof around agent learning.** Preserve editable voice traits and the four proof events. Make status text and evidence arrival understandable without animation.
- [ ] **Step 5: Build selectable Control.** Use native radio inputs for all three autonomy modes, update a live summary, show the exclusions, add `You can change this later in Agent settings.`, and require a separate confirmation before activation.
- [ ] **Step 6: Build the completion receipt.** Show sources, voice, scope, and selected control mode; link to `/inbox`; add `Change control level` wired to `EDIT_AUTONOMY`.

---

### Task 4: Build the WISMO evidence-manifest visual system

**Files:**
- Replace: `src/app/connect/page.module.css`
- Modify: `.interface-design/system.md`

**Interfaces:**
- Produces responsive desktop rail and mobile manifest header.
- Produces the cobalt evidence line, agent-status pulse, source verification, proof trace, control selection, and receipt stamp interactions.

- [ ] **Step 1: Establish route tokens.** Map paper `#F7F4EA`, deep paper `#ECE5D5`, kraft `#CDAE7D`, ink `#171714`, soft ink `#5B594F`, line `#D1C8B6`, and cobalt `#2457FF` into route variables.
- [ ] **Step 2: Build the desktop shell.** Use a 296px rail above 1200px, 264px at tablet widths, and a `min(100%, 780px)` workspace. Use surface shifts and 1px rules rather than generic shadow cards.
- [ ] **Step 3: Build the mobile shell.** Use a 64px sticky header, `Step N of 5`, current label, agent status, and a 4px cobalt progress line with 20px/16px gutters.
- [ ] **Step 4: Apply readable typography.** Use 56/42px titles, 16px body/input text, 14px controls, 13px helpers, and 12px mono labels; no user-facing text below 12px.
- [ ] **Step 5: Add purposeful micro-interactions.** Use 100–160ms button feedback, 180–220ms stage transitions, a working-only status pulse, source check-ins, voice trait reveal, proof event arrival, immediate control-summary response, and a short receipt stamp. Animate only opacity and transform; nothing loops while idle.
- [ ] **Step 6: Update the interface system.** Record the evidence-manifest direction, cobalt-only accent, five-stage map, persistent agent status, and selectable control pattern.

---

### Task 5: Validate the complete journey

**Files:**
- Modify only files required by failures found during validation.

**Interfaces:**
- Produces a tested build with no changed external side effects.

- [ ] **Step 1: Run automated checks.** Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`. Expected: all exit 0.
- [ ] **Step 2: Audit copy and state.** Search `/connect` for misleading `connected`, `sent`, `delivered`, and `active` claims. Every external action must remain qualified as guided/local setup.
- [ ] **Step 3: Walk the state machine.** Verify retries, back navigation, Gmail invalidation, Shopify invalidation, voice edits, proof progress, all three control selections, activation, edit-after-activation, refresh restoration, and v2 migration.
- [ ] **Step 4: Check responsive and accessible behavior.** Inspect 375×812, 390×844, 768×1024, 1024×768, and 1440×900; test keyboard flow, visible focus, 200% zoom, and reduced motion. If browser tooling is unavailable, report that exact limitation instead of claiming visual verification.

## Final Review Checklist

- [ ] Five visible stages read Brief / Evidence / Voice / Proof / Control.
- [ ] Gmail and Shopify remain independently retryable within Evidence.
- [ ] Agent status changes with real reducer state and is announced accessibly.
- [ ] All three control modes are selectable and persisted.
- [ ] The user is told the control level can be changed later and can return to edit it after activation.
- [ ] No external connection, message, or activation is falsely claimed.
- [ ] Existing adapters, password handling, invalidation rules, and reduced motion remain safe.
- [ ] Automated checks pass and visual limitations are reported honestly.
