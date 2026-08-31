# Simulated Onboarding Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/connect` with a resumable six-step simulated onboarding that connects Gmail then Shopify, reveals an editable store voice profile, proves one WISMO test-order reply, and explicitly activates automatic WISMO replies.

**Architecture:** A pure reducer owns the onboarding state and invalidation rules. A client-side provider persists safe fields to versioned local storage, while focused step components render native forms and deterministic simulated connection timelines. Gmail and Shopify adapters expose the same async boundary future OAuth implementations will use without pretending this version makes external calls.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, Vitest, Testing Library, browser localStorage

**Spec:** `docs/design/onboarding-journey.md`

## Global Constraints

- Replace `/connect`; do not add another onboarding route.
- This phase is simulated and must not claim an external account or email was actually connected or delivered.
- Flow order is account → Gmail → Shopify → voice review → test → launch.
- Automatic replies cover only “Where is my order?” emails.
- Never persist the account password.
- Preserve the existing WISMO type, color, spacing, focus, and reduced-motion tokens.
- Support 1440px, 768px, 390px, keyboard-only use, and 200% zoom.

---

### Task 1: Define and test the onboarding state machine

**Files:**
- Create: `src/app/connect/onboardingTypes.ts`
- Create: `src/app/connect/onboardingReducer.ts`
- Create: `src/app/connect/onboardingReducer.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `OnboardingStep`, `ConnectionStatus`, `VoiceProfile`, `TestRun`, `OnboardingState`, `OnboardingAction`, `initialOnboardingState`, and `onboardingReducer(state, action)`.

- [ ] **Step 1: Add the test runner.** Install `vitest`, `@testing-library/react`, `@testing-library/user-event`, and `jsdom`; add `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
- [ ] **Step 2: Write reducer tests before implementation.** Cover account completion, required step order, Gmail success, Shopify success, voice acceptance, test completion, launch, Gmail invalidating only the test, and Shopify invalidating voice plus test. Assert that no action can skip prerequisites.
- [ ] **Step 3: Run `npm test -- onboardingReducer.test.ts`.** Expected result: failure because the reducer module does not exist.
- [ ] **Step 4: Implement exact state.** Use steps `account | gmail | shopify | voice | test | launch`; connection statuses `idle | connecting | connected | error`; test statuses `idle | sending | received | checking | prepared | error`; and actions `ACCOUNT_COMPLETED`, `GMAIL_CONNECT_STARTED`, `GMAIL_CONNECTED`, `GMAIL_FAILED`, `SHOPIFY_CONNECT_STARTED`, `SHOPIFY_CONNECTED`, `SHOPIFY_FAILED`, `VOICE_UPDATED`, `VOICE_ACCEPTED`, `TEST_STARTED`, `TEST_ADVANCED`, `TEST_FAILED`, `AUTOMATION_ACTIVATED`, `GO_BACK`, and `RESTORED`.
- [ ] **Step 5: Run the reducer test and lint.** `npm test -- onboardingReducer.test.ts && npm run lint` must pass.
- [ ] **Step 6: Commit.** Commit the reducer, tests, and test dependencies as `feat: add onboarding state machine`.

### Task 2: Add safe persistence and deterministic simulation adapters

**Files:**
- Create: `src/app/connect/onboardingStorage.ts`
- Create: `src/app/connect/onboardingStorage.test.ts`
- Create: `src/app/connect/simulatedConnections.ts`
- Create: `src/app/connect/simulatedConnections.test.ts`

**Interfaces:**
- Consumes: state types from Task 1.
- Produces: `loadOnboarding(): OnboardingState`, `saveOnboarding(state): void`, `clearOnboarding(): void`, `connectGmail(email): Promise<GmailConnection>`, `connectShopify(domain): Promise<ShopifyConnection>`, `analyzeStore(connection): Promise<VoiceProfile>`, and `runTestOrder(order, onEvent): Promise<TestRun>`.

- [ ] **Step 1: Write storage tests.** Assert version key `wismo:onboarding:v1`, valid-state restoration, malformed-data fallback, and omission of `password` from serialized JSON.
- [ ] **Step 2: Write adapter tests with fake timers.** Assert Gmail resolves with the account email, Shopify normalizes bare domains to `.myshopify.com`, voice analysis returns the seeded Northstar profile, and test events fire in order: `sending → received → checking → prepared`.
- [ ] **Step 3: Run both tests.** Expected result: failure because storage and adapters do not exist.
- [ ] **Step 4: Implement browser-safe persistence.** Guard `window`, validate the stored version and required fields, and fall back to `initialOnboardingState` on any parse or shape error.
- [ ] **Step 5: Implement deterministic adapters.** Use cancellable `setTimeout` stages of 500–900ms, reject domains containing `fail`, and keep all copy labeled as a simulation.
- [ ] **Step 6: Run `npm test` and `npm run lint`.** Both must pass.
- [ ] **Step 7: Commit.** Commit as `feat: add simulated onboarding services`.

### Task 3: Build the onboarding shell and account/Gmail steps

**Files:**
- Create: `src/app/connect/OnboardingJourney.tsx`
- Create: `src/app/connect/OnboardingRail.tsx`
- Create: `src/app/connect/AccountStep.tsx`
- Create: `src/app/connect/GmailStep.tsx`
- Create: `src/app/connect/OnboardingJourney.test.tsx`
- Modify: `src/app/connect/page.tsx`
- Replace: `src/app/connect/page.module.css`

**Interfaces:**
- Consumes: reducer, storage, and `connectGmail` from Tasks 1–2.
- Produces: `<OnboardingJourney />`, a six-step rail, account form, and simulated Gmail permission state.

- [ ] **Step 1: Write journey tests.** Assert `/connect` begins at account, rejects invalid email and passwords under 10 characters, never persists the password, advances to Gmail, shows a simulation notice, and resumes the restored step after remount.
- [ ] **Step 2: Run the component test.** Expected result: failure because the journey components do not exist.
- [ ] **Step 3: Build the shell.** Render a 280px connected-system rail beside one `<main>` work surface; expose current step with `aria-current="step"`; use a compact progress header below 700px.
- [ ] **Step 4: Build the account form.** Use native labeled inputs for name, email, and password; add show/hide; provide inline validation; retain name/email only; submit `ACCOUNT_COMPLETED`.
- [ ] **Step 5: Build Gmail simulation.** Show the exact address, permissions `Read delivery questions` and `Send replies`, an always-visible `Simulation` badge, working/error/success states, and retry behavior.
- [ ] **Step 6: Wire persistence.** Restore once on mount and save after state changes without writing the password.
- [ ] **Step 7: Run `npm test`, `npm run lint`, and `npm run build`.** All must pass.
- [ ] **Step 8: Commit.** Commit as `feat: build account and Gmail onboarding`.

### Task 4: Build Shopify connection and the voice-fingerprint aha moment

**Files:**
- Create: `src/app/connect/ShopifyStep.tsx`
- Create: `src/app/connect/VoiceStep.tsx`
- Create: `src/app/connect/VoiceSpecimen.tsx`
- Create: `src/app/connect/VoiceStep.test.tsx`
- Modify: `src/app/connect/OnboardingJourney.tsx`
- Modify: `src/app/connect/page.module.css`

**Interfaces:**
- Consumes: `connectShopify`, `analyzeStore`, `VoiceProfile`, and reducer actions.
- Produces: store-domain connection, analysis state, editable voice traits/greeting/guidance, color specimen, and accepted voice profile.

- [ ] **Step 1: Write tests.** Assert invalid store domains stay blocked, approval connects the seeded store, analysis renders a progress sequence, detected colors and `Warm / Direct / Reassuring` appear, edits persist, and acceptance unlocks the test step.
- [ ] **Step 2: Run `npm test -- VoiceStep.test.tsx`.** Expected result: failure because the Shopify and voice components do not exist.
- [ ] **Step 3: Build Shopify connection.** Use a labeled domain input, explicit simulated approval panel, working/error/success states, and a change-store action that triggers reducer invalidation.
- [ ] **Step 4: Build the analysis transition.** Show `Reading storefront copy`, then `Learning theme styling`, then reveal the profile. Use opacity and 12px movement only; crossfade under reduced motion.
- [ ] **Step 5: Build `VoiceSpecimen`.** Render store name, three controlled color swatches, detected traits as removable inputs, editable greeting and response guidance, and the Amina example reply using the store canvas/ink/accent only inside the specimen.
- [ ] **Step 6: Keep hierarchy deliberate.** The reply specimen is the focal surface; detector metadata is secondary; `Use this voice` is the only primary action.
- [ ] **Step 7: Run tests, lint, and build.** All must pass.
- [ ] **Step 8: Commit.** Commit as `feat: add Shopify voice discovery`.

### Task 5: Prove one test order and require explicit launch

**Files:**
- Create: `src/app/connect/TestStep.tsx`
- Create: `src/app/connect/LaunchStep.tsx`
- Create: `src/app/connect/TestStep.test.tsx`
- Modify: `src/app/connect/OnboardingJourney.tsx`
- Modify: `src/app/connect/page.module.css`

**Interfaces:**
- Consumes: accepted voice profile, `runTestOrder`, test events, and activation action.
- Produces: seeded order picker, simulated inbox run, proof trace, automation boundary, and active receipt.

- [ ] **Step 1: Write tests.** Assert the test is locked before voice acceptance; order `#TEST-4921` can be selected; events appear one at a time; launch stays disabled before `prepared`; the final checkbox label exactly names WISMO-only scope; and activation reaches the receipt.
- [ ] **Step 2: Run `npm test -- TestStep.test.tsx`.** Expected result: failure because test and launch components do not exist.
- [ ] **Step 3: Build the test step.** Show the selected test order, connected inbox, `Simulation` badge, and one ordered trace with Customer email → Shopify order → Courier status → WISMO reply. Announce status changes through `aria-live="polite"`.
- [ ] **Step 4: Render the final reply in the accepted voice.** Keep the source evidence readable and never label the message `Delivered`; use `Prepared in simulation`.
- [ ] **Step 5: Build the launch boundary.** Require an unchecked confirmation labeled `Automatically reply to “Where is my order?” emails`; list excluded cases `address changes`, `refunds`, and `delivery conflicts`; make activation a separate button.
- [ ] **Step 6: Build the active receipt.** Show Gmail, Shopify, accepted voice, WISMO-only scope, and `Automation active in simulation`, with controls to revisit connections.
- [ ] **Step 7: Run tests, lint, and build.** All must pass.
- [ ] **Step 8: Commit.** Commit as `feat: add onboarding proof and launch`.

### Task 6: Responsive, accessibility, state-recovery, and deployment checks

**Files:**
- Modify only files required by failures found in this task.

**Interfaces:**
- Consumes: the complete `/connect` onboarding.
- Produces: verified production-ready simulated flow.

- [ ] **Step 1: Run automated checks.** `npm test && npm run lint && npm run build` must all exit successfully.
- [ ] **Step 2: Verify recovery.** Refresh after Gmail, Shopify, voice acceptance, and prepared test; confirm each resumes correctly and password never appears in local storage.
- [ ] **Step 3: Verify invalidation.** Change Gmail after a completed test and confirm only the test resets; change Shopify and confirm voice plus test reset.
- [ ] **Step 4: Verify responsive layouts.** Walk every step at 1440px, 768px, and 390px; confirm no horizontal scroll, clipped controls, overlapping rail/content, or hidden error text.
- [ ] **Step 5: Verify accessibility.** Complete with keyboard only, test 200% zoom, confirm focus moves to each step heading, confirm status announcements, and repeat with reduced motion enabled.
- [ ] **Step 6: Verify language.** Search `/connect` for `connected`, `sent`, `delivered`, and `active`; every external-state claim must include `simulation` in this phase.
- [ ] **Step 7: Deploy preview.** Run `vercel --yes`, complete one production-like walkthrough, and obtain approval before `vercel --prod`.
- [ ] **Step 8: Commit fixes.** Commit verification changes as `fix: harden simulated onboarding journey`.

