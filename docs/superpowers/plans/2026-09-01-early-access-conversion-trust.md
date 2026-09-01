# Early Access Conversion and Trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public Wismo funnel honestly collect early-access emails, answer the main trust questions, and measure each conversion step with Vercel Analytics.

**Architecture:** Keep the marketing page server-rendered and add one small client-side tracked-link component for CTA events. Keep the existing Convex waitlist mutation backward-compatible while reducing the public form to one email field. Store trust and FAQ copy in the typed landing-content module so content tests can cover every required claim.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Convex, Vercel Analytics, Vitest.

**Spec:** User request from September 1, 2026 in this conversation.

## Global Constraints

- Every acquisition CTA must read `Join early access` and link to `/connect`.
- The early-access form collects only a work email; name and company are collected later.
- Do not invent production results or claim that the beta is already autonomous.
- Do not send email addresses or other personal data to analytics.
- Preserve the existing evidence-desk visual language and responsive behavior.

---

### Task 1: Conversion and trust content

**Files:**
- Modify: `src/app/landing/content.ts`
- Modify: `src/app/landing/content.test.ts`

**Interfaces:**
- Consumes: Existing `LandingContent` and `landingContent` exports.
- Produces: Typed `trust`, `nextSteps`, and `faq` content consumed by `src/app/page.tsx`.

- [x] **Step 1: Update the content test with assertions for the CTA label, six trust answers, next steps, and FAQ.**
- [x] **Step 2: Run `npm test -- src/app/landing/content.test.ts` and confirm the new assertions fail.**
- [x] **Step 3: Add the typed content and replace setup language with honest early-access language.**
- [x] **Step 4: Run `npm test -- src/app/landing/content.test.ts` and confirm it passes.**

### Task 2: Homepage trust and FAQ sections

**Files:**
- Create: `src/app/landing/TrackedCta.tsx`
- Modify: `src/app/landing/LandingNav.tsx`
- Modify: `src/app/landing/EvidenceHero.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css`

**Interfaces:**
- Consumes: `landingContent.trust`, `landingContent.nextSteps`, and `landingContent.faq`.
- Produces: `TrackedCta` with `href`, `location`, `className`, and children props; it records `CTA Click` without personal data.

- [x] **Step 1: Add `TrackedCta` as the smallest possible client component using `track` from `@vercel/analytics`.**
- [x] **Step 2: Replace the three acquisition links in navigation, hero, and final CTA with tracked links.**
- [x] **Step 3: Render a safety-boundary section directly after the ten-case proof, followed by three next steps and a native-details FAQ.**
- [x] **Step 4: Add responsive CSS that extends the existing paper-and-ink system without introducing a generic card grid.**

### Task 3: One-field waitlist and funnel analytics

**Files:**
- Modify: `src/app/connect/WaitlistForm.tsx`
- Modify: `src/app/connect/waitlist.module.css`
- Modify: `src/app/connect/page.tsx`

**Interfaces:**
- Consumes: Existing `waitlist:join` mutation with `{ email, name?, company? }`.
- Produces: Events `Waitlist Form Started`, `Waitlist Form Error`, and `Waitlist Signup Completed`, with only non-personal status properties.

- [x] **Step 1: Remove name and company state and inputs, leaving one required email input.**
- [x] **Step 2: Track the first focus/change as `Waitlist Form Started`, validation or submission failures as `Waitlist Form Error`, and successful mutation results as `Waitlist Signup Completed`.**
- [x] **Step 3: Rewrite the page copy so visitors know profile details come during onboarding and add compact privacy/security reassurance.**
- [x] **Step 4: Give `/connect` a unique description and canonical URL through static metadata.**

### Task 4: Verification

**Files:**
- Verify only; no new file is expected.

**Interfaces:**
- Consumes: The completed implementation.
- Produces: Evidence that content tests, the full test suite, lint, and production build succeed.

- [x] **Step 1: Run `npm test`.**
- [x] **Step 2: Run `npm run lint`.**
- [x] **Step 3: Run `npm run build`.**
- [x] **Step 4: Inspect the final diff and confirm no unrelated user changes were overwritten.**
