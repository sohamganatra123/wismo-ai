# Wismo Typography and Onboarding Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair cramped landing-page typography while preserving the oversized WISMO logo, then redesign the complete `/connect` journey around briefing, observing, and supervising an agent without changing onboarding behavior.

**Architecture:** Move the shared paper/ink/cobalt and type-scale decisions into root tokens, then apply route-specific display rules in the landing and connect CSS modules. Keep the existing onboarding reducer, persistence, and simulated adapters intact; extract only static onboarding copy so step numbering and simulation language can be tested independently. Validate the result with browser screenshots and scripted checks across every onboarding state.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript, CSS Modules, Motion 13, Vitest, Playwright browser checks

**Spec:** `docs/design/typography-onboarding-refinement.md`

## Global Constraints

- Keep exactly two typefaces: Archivo and IBM Plex Mono.
- Keep one brand accent: cobalt `#2457FF`; error red is semantic, not decorative.
- Preserve the oversized WISMO hero logo and set its tracking to `-0.065em`.
- Do not mention simulation on the public landing page. Keep its handoff copy neutral and avoid claiming that an external account has already been connected.
- Do not change the onboarding reducer, saved-state schema, step order, simulation adapters, or route paths.
- Do not claim `/connect` uses Google sign-in or connects an external account while it remains a simulation.
- Do not introduce a component library, icon library, or new animation package.
- Landing body copy stays at least 15px; onboarding inputs stay at least 16px; utility copy stays at least 11px on landing and 12px in onboarding.
- All controls remain at least 44×44px and all focus states remain visible.
- Preserve reduced-motion behavior and native document scrolling.
- Preserve the untracked `website-feedback/` references; do not edit, move, or commit them unless the user explicitly requests it.

---

### Task 1: Establish shared Wismo type and surface tokens

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/page.module.css`
- Modify: `src/app/connect/page.module.css`

**Interfaces:**
- Produces global tokens `--wismo-paper`, `--wismo-paper-deep`, `--wismo-kraft`, `--wismo-ink`, `--wismo-ink-soft`, `--wismo-line`, `--wismo-signal`, `--type-body`, `--type-ui`, `--type-label`, and `--type-footnote`.
- Consumed by the landing page, login route, and `/connect` styles.

- [ ] **Step 1: Record the current visual baseline.** Start `npm run dev` and capture `/` and `/connect` at 390×844 and 1440×900 before editing. Store temporary captures outside the repository or under `/tmp`; do not replace the user feedback screenshots.

- [ ] **Step 2: Move the shared Wismo primitives into `globals.css`.** Add these exact tokens to `:root` and remove their duplicate `:global(:root)` declarations from `page.module.css`:

```css
:root {
  --wismo-paper: #f7f4ea;
  --wismo-paper-deep: #ece5d5;
  --wismo-kraft: #cdae7d;
  --wismo-ink: #171714;
  --wismo-ink-soft: #5b594f;
  --wismo-line: #d1c8b6;
  --wismo-signal: #2457ff;
  --type-body: clamp(1rem, 0.28vw + 0.94rem, 1.125rem);
  --type-ui: 0.875rem;
  --type-label: 0.75rem;
  --type-footnote: 0.75rem;
}
```

- [ ] **Step 3: Add text-rendering defaults.** Keep antialiasing and add kerning to `body` without adding a third font:

```css
body {
  font-kerning: normal;
  font-feature-settings: "kern" 1;
}
```

- [ ] **Step 4: Replace route-local hardcoded copies of the six primitives.** In both CSS modules, map backgrounds, text, dividers, focus, and primary actions to the shared tokens. Retain semantic error red only for `.error`.

- [ ] **Step 5: Run static checks.** Run `npm run lint` and `git diff --check`. Expected: both exit 0, and `rg -n '#2457ff|#f7f4ea|#171714' src/app` shows those values only in the root token definition, generated store-color data, or image/OG code that cannot consume CSS variables.

- [ ] **Step 6: Commit.**

```bash
git add src/app/globals.css src/app/page.module.css src/app/connect/page.module.css
git commit -m "style: establish shared Wismo type tokens"
```

---

### Task 2: Repair landing-page tracking, word spacing, and minimum sizes

**Files:**
- Modify: `src/app/page.module.css`
- Modify: `src/app/landing/content.ts`
- Modify: `src/app/landing/content.test.ts`

**Interfaces:**
- Consumes the shared type tokens from Task 1.
- Produces readable hero, support, journey, proof, and final CTA type at desktop and mobile sizes.
- Produces concise, action-neutral `/connect` handoff notes without simulation language while leaving `/login` copy unchanged.

- [ ] **Step 1: Add a failing handoff-copy test.** Extend `content.test.ts`:

```ts
it("describes the simulated connect handoff honestly", () => {
  expect(landingContent.hero.note).toContain("Setup takes about 5 minutes");
  expect(landingContent.hero.note).not.toContain("simulation");
  expect(landingContent.hero.note).not.toContain("Google sign-in");
  expect(landingContent.finalCta.note).not.toContain("simulation");
});
```

- [ ] **Step 2: Run the focused test.** Run `npm test -- src/app/landing/content.test.ts`. Expected: FAIL because the current note says Google sign-in.

- [ ] **Step 3: Correct only the connect handoff notes.** Set both hero and final connect notes to neutral setup language that does not mention simulation or claim an external connection. Use:

```ts
"Setup takes about 5 minutes · progress stays on this device"
```

Do not change either CTA label or route. `/login` remains the existing-user Google-auth route.

- [ ] **Step 4: Replace the headline tracking rules.** Apply these limits:

```css
.heroBrand {
  letter-spacing: -0.065em;
  line-height: 0.78;
}

.heroCopy h1 {
  letter-spacing: -0.032em;
  word-spacing: 0.08em;
  line-height: 0.98;
}

.sectionHeading h2,
.sequenceIntro h2,
.proof h2,
.finalCta h2,
.journeySteps h3 {
  letter-spacing: -0.042em;
  word-spacing: 0.08em;
  line-height: 0.92;
}
```

The oversized hero logo is the sole exception to the general `-0.05em` floor and uses `-0.065em`.

- [ ] **Step 5: Raise the desktop minimums.** Set navigation and buttons to 14px, body copy to `var(--type-body)`, eyebrows to 12px, evidence/test labels to at least 12px, and footer/notes to at least 12px. Keep mono labels tracked but add `word-spacing: 0.04em`.

- [ ] **Step 6: Raise the mobile minimums.** Replace the current `.heroBody { font-size: .76rem }`, `.heroNote { font-size: .5rem }`, and other sub-12px mobile declarations. Use 15px for body, 13px for actions, 11px for landing footnotes, and 11px for mono utility labels.

- [ ] **Step 7: Control line length after increasing type.** Keep body text to 52–68 characters per line, use `text-wrap: pretty`, and increase gaps rather than reducing type when a row no longer fits. Let evidence labels and final footer notes wrap.

- [ ] **Step 8: Compare against all three feedback screenshots.** At 1440×900, capture the hero, proof, and final CTA. Expected: `Where is my order?`, `Two bad answers…`, and `Turn WISMO questions…` have visibly distinct word spaces; no supporting text requires zooming.

- [ ] **Step 9: Run tests and commit.**

```bash
npm test -- src/app/landing/content.test.ts
npm run lint
git add src/app/page.module.css src/app/landing/content.ts src/app/landing/content.test.ts
git commit -m "style: improve Wismo landing readability"
```

---

### Task 3: Extract onboarding copy and rebuild the setup-manifest shell

**Files:**
- Create: `src/app/connect/onboardingContent.ts`
- Create: `src/app/connect/onboardingContent.test.ts`
- Modify: `src/app/connect/OnboardingJourney.tsx`
- Replace: `src/app/connect/page.module.css`

**Interfaces:**
- Produces `onboardingSteps`, `OnboardingStepContent`, and shared step headers with correct numbering.
- Keeps `OnboardingJourney` props and reducer dispatch actions unchanged.
- Produces the desktop manifest rail and mobile manifest header.

- [ ] **Step 1: Write the failing content test.** Create `onboardingContent.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { onboardingSteps } from "./onboardingContent";

describe("onboarding content", () => {
  it("numbers all six steps in order", () => {
    expect(onboardingSteps.map((step) => step.number)).toEqual([
      "01", "02", "03", "04", "05", "06",
    ]);
    expect(onboardingSteps[0].eyebrow).toBe("01 · Your account");
  });

  it("keeps the simulated boundary explicit", () => {
    expect(onboardingSteps.every((step) => step.simulated)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test.** Run `npm test -- src/app/connect/onboardingContent.test.ts`. Expected: FAIL because the module does not exist.

- [ ] **Step 3: Create the typed content source.** Define:

```ts
export type OnboardingStepContent = {
  id: OnboardingStep;
  number: "01" | "02" | "03" | "04" | "05" | "06";
  label: string;
  hint: string;
  eyebrow: string;
  simulated: true;
};
```

Export all six existing steps in the existing reducer order. Use `01 · Your account`, `02 · Gmail`, `03 · Your Shopify store`, `04 · Your voice`, `05 · Proof run`, and `06 · Go live`.

- [ ] **Step 4: Consume the content source without changing flow logic.** Replace the local `steps` array and hardcoded header eyebrows with `onboardingSteps`. Keep all reducer actions, state conditions, and async adapters byte-for-byte equivalent in behavior.

- [ ] **Step 5: Rebuild the desktop shell.** Use a 296px rail above 1200px and 264px at tablet widths. Change the wordmark to `WISMO.ai`, label the rail `SETUP MANIFEST`, and show textual states `CURRENT`, `VERIFIED`, or `LOCKED`. Use one cobalt vertical line and remove amber/jade progress colors.

- [ ] **Step 6: Rebuild the mobile shell.** Use a 64px sticky header with `Step N of 6`, the current label, and a 4px cobalt progress element. Keep it above content without obscuring focused controls. Use 20px gutters at 390px and 16px at 375px.

- [ ] **Step 7: Apply the onboarding type scale.** Use 56/42px page titles, 16px body/input text, 14px labels/buttons, 13px helper/rail text, and 12px mono labels. Add positive `word-spacing: 0.06em` to onboarding titles and never use tracking below `-0.03em`.

- [ ] **Step 8: Use one depth system.** Use warm surface shifts and 1px rules. Remove generic large-radius shadow cards from the shell; retain bounded surfaces only where the surface is the interaction. The current rail button may translate up by 2px on hover/focus without changing layout bounds.

- [ ] **Step 9: Run content, reducer, and storage tests.**

```bash
npm test -- src/app/connect/onboardingContent.test.ts src/app/connect/onboardingReducer.test.ts src/app/connect/onboardingStorage.test.ts
npm run lint
```

Expected: all pass; no stored-state or reducer snapshots change.

- [ ] **Step 10: Commit.**

```bash
git add src/app/connect/onboardingContent.ts src/app/connect/onboardingContent.test.ts src/app/connect/OnboardingJourney.tsx src/app/connect/page.module.css
git commit -m "style: build Wismo setup manifest"
```

---

### Task 4: Restyle every onboarding interaction and make agent activity visible

**Files:**
- Modify: `src/app/connect/OnboardingJourney.tsx`
- Modify: `src/app/connect/page.module.css`

**Interfaces:**
- Consumes the setup-manifest shell and content from Task 3.
- Preserves all existing component props and reducer action names.
- Produces coherent default, working, success, error, and disabled styles for all six steps.

- [ ] **Step 1: Restyle the account step.** Keep the native labels and validation. Use 56px warm inset fields, 16px input text, 14px labels, 13px error copy, and a horizontal simulation rule. Verify password reveal remains a 44px target and password is not persisted.

- [ ] **Step 2: Restyle Gmail as `SOURCE 01 / GMAIL`.** Remove the fake `M` logo block. Keep the connected address, permissions list, simulation stamp, primary action, working state, error state, and retry action. Make permission titles 15px and descriptions 13px.

- [ ] **Step 3: Restyle Shopify as `SOURCE 02 / SHOPIFY`.** Remove the fake `S` logo block. Keep the URL validation and normalization behavior. Render the existing three connection stages along one cobalt scan line; under reduced motion, show the active text state without a traveling line.

- [ ] **Step 4: Recompose the voice fingerprint.** Keep simulated store colors inside `.voiceSpecimen` only. Make the reply block the focal element at 20px desktop / 18px mobile. At widths below 900px and at 200% zoom, set traits and voice fields to one column. Keep remove buttons at least 44×44px and preserve their accessible labels.

- [ ] **Step 5: Recompose the proof run as a case trace.** Keep the same four stages and state ranking. Use 13px mono stage labels, 15px values, a continuous cobalt trace, and textual `VERIFIED` state. Keep `aria-live="polite"` and the `Prepared in simulation` wording.

- [ ] **Step 6: Recompose launch as a selectable autonomy boundary.** Offer `Investigate only`, `Draft for approval` (recommended), and `Resolve verified cases`. Update a plain-language summary immediately to show what WISMO may do alone, what needs approval, and what always escalates. Keep the exact exclusions visible for every mode and add `You can change this later in Agent settings.` Preserve readable disabled styling and native control behavior.

- [ ] **Step 7: Recompose completion as a dispatch receipt.** Keep Inbox, Store, Voice, and Scope values in a readable definition list. Replace the oversized green success circle with a cobalt `VERIFIED / SIMULATION` stamp that does not carry state by color alone.

- [ ] **Step 8: Build the agent-status micro-interactions.** Carry one persistent status through all six steps: `Waiting for you`, `Checking source`, `Learning`, `Investigating`, `Needs your decision`, and `Ready`. Draw the evidence trail as sources become available, confirm source access, reveal learned voice traits, advance proof evidence one event at a time, update the autonomy summary immediately, and finish with a short cobalt work-receipt stamp. Never loop motion while the agent is idle.

- [ ] **Step 9: Standardize interaction states.** Every button, rail row, field, autonomy choice, checkbox, trait editor, and link gets default, hover, active, focus, disabled, working, success, and error states as applicable. Use 100–160ms press feedback and 180–220ms step transitions; animate only opacity and transform. Preserve the landing hero/stamp entrance, CTA press, navigation underline, evidence-tab lift, and scroll-driven investigation scene.

- [ ] **Step 10: Verify behavior and persistence.** Complete all six steps, change the autonomy selection, refresh, and confirm it remains visible. Go back to Gmail, reconnect, and confirm only the test resets. Go back to Shopify, change it, and confirm voice plus test reset. Confirm the control level can be changed later from Agent settings.

- [ ] **Step 11: Commit.**

```bash
git add src/app/connect/OnboardingJourney.tsx src/app/connect/page.module.css
git commit -m "style: refine Wismo onboarding interactions"
```

---

### Task 5: Validate typography, accessibility, and all responsive states

**Files:**
- Modify only files required by failures found in this task.

**Interfaces:**
- Consumes the completed landing and onboarding refinement.
- Produces a browser-verified release without cramped type, tiny copy, broken setup states, or false connection claims.

- [ ] **Step 1: Run automated checks.** Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 2: Scan source for prohibited type values.** Search landing and connect CSS for font sizes below the route minimums and tracking tighter than `-0.05em`:

```bash
rg -n 'font-size:\s*(\.([0-6])rem|[0-9]|1[0-4]px)|letter-spacing:\s*-\.0([6-9]|[1-9][0-9])em' src/app/page.module.css src/app/connect/page.module.css
```

Review every match manually. Decorative barcode widths and screen-reader-only rules are not text exceptions.

- [ ] **Step 3: Capture the five required breakpoints.** Capture `/` and every `/connect` step at 375×812, 390×844, 768×1024, 1024×768, and 1440×900. Expected: no horizontal overflow, clipped wordmark, hidden helper text, or collision with sticky progress.

- [ ] **Step 4: Recreate the three feedback views.** Capture the hero, proof, and final CTA at 1440px and compare side by side with `website-feedback/`. Expected: word spaces are clear, headlines remain bold, and supporting copy is visibly larger.

- [ ] **Step 5: Test 200% zoom and reflow.** At 1280px browser width and 200% zoom, walk every onboarding step. Expected: rail collapses before it crowds the work surface, trait editors wrap, inputs remain fully visible, and no two-dimensional scrolling is required.

- [ ] **Step 6: Test keyboard and focus.** Complete account, Gmail, Shopify, voice editing, proof run, and launch by keyboard. Expected: focus order follows visual order, the sticky mobile header never obscures focus, all rings are visible, and disabled steps cannot be activated.

- [ ] **Step 7: Test reduced motion.** Expected: landing prose remains visible, the autonomous journey uses its five static frames, onboarding step changes do not move, scan lines become static status indicators, and no hydration or browser-console errors appear.

- [ ] **Step 8: Audit handoff and simulation claims.** Search for `Google sign-in`, `connected`, `sent`, `delivered`, and `active` in landing/connect source. Every `/connect` external-state claim must say simulation; `/login` may retain Google authentication wording.

- [ ] **Step 9: Commit validation fixes.**

```bash
git add src/app docs/design/typography-onboarding-refinement.md docs/superpowers/plans/2026-09-01-wismo-typography-onboarding-refinement.md
git commit -m "fix: validate Wismo typography and onboarding"
```

---

## Final Review Checklist

- [ ] Archivo and IBM Plex Mono remain the only typefaces.
- [ ] No headline tracking is tighter than `-0.05em`, except the oversized WISMO logo at `-0.065em`.
- [ ] Hero, proof, and final CTA word spaces remain visible when squinting.
- [ ] Landing body is at least 15px; onboarding input text is 16px.
- [ ] Landing utility copy is at least 11px; onboarding utility copy is at least 12px.
- [ ] The brand remains the loudest hero element.
- [ ] `/connect` uses paper, ink, kraft, and cobalt without replaying the landing hero image.
- [ ] Setup rail states say CURRENT / VERIFIED / LOCKED in text.
- [ ] Cards exist only where the card is the interaction.
- [ ] The voice specimen remains the onboarding high point.
- [ ] Every step has readable idle, working, success, error, and disabled states where applicable.
- [ ] Landing copy uses neutral setup language without mentioning simulation or claiming a completed external connection.
- [ ] Reducer behavior, persistence schema, and simulation adapters remain unchanged.
- [ ] All required breakpoints, 200% zoom, keyboard, and reduced motion pass.
