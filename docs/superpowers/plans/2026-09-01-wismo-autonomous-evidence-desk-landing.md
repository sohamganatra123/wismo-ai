# Wismo.ai Autonomous Evidence Desk Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current public homepage with a playful, immersive Wismo.ai landing page that sells autonomous WISMO resolution, demonstrates the complete zero-touch journey, and gives new and existing users clear entry points.

**Architecture:** Keep the route itself server-rendered and static, with two small landing-page client components for the hero entrance and one scroll-linked journey that moves a WISMO case from parcel scan to courier check to autonomous reply. Store all claims and labels in a typed content file so tests distinguish gated autonomous mode from current v1 approval mode. Add one focused client form under a dedicated `/login` route for existing users; use real-looking editorial parcel photography, CSS Modules, and Motion for React only where movement explains the workflow.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript 5, CSS Modules, `next/image`, `next/font/google`, Motion for React 13.1, Vitest 4.1.11

**Spec:** `../../../../scoping.md`

## Global Constraints

- The public page's primary action is **Connect support mailbox**, linking to `/connect`.
- The secondary action is **Log in**, linking to a dedicated `/login` route that signs existing users in with Google and returns them to `/inbox`.
- Autonomous WISMO resolution is the core proposition and must appear in the hero, journey, metadata, and final CTA.
- The zero-touch journey is labeled `AUTONOMOUS MODE · AFTER SAFETY GATE`; do not present it as the current v1 operating mode.
- Wismo v1 remains manager-assisted decision support. Customer messages, courier messages, and Shopify changes require manager approval until the safety gate is met.
- Brand first: `WISMO.ai` is the largest text in the hero.
- The hero is one full-bleed composition with no cards, stat strip, logo cloud, dashboard frame, or generic AI gradient.
- Use no more than two typefaces and one chromatic accent color.
- Each section has one job and one dominant visual idea.
- Ship exactly three motion systems: hero entrance, the scroll-linked autonomous parcel journey, and a shared micro-interaction family for CTAs, login, evidence labels, and completion feedback.
- Respect `prefers-reduced-motion`; the complete story remains readable with all motion disabled.
- All controls are keyboard reachable, show visible focus, and have a minimum 44×44px target.
- Validate at 375px, 768px, 1024px, and 1440px with no horizontal scrolling.
- Do not reuse existing landing-page visuals, components, copy, or art direction. Existing product routes and the `/connect` flow remain intact.
- Do not invent customer logos, testimonials, percentages, security certifications, or performance claims.

---

## 1. Creative Direction

### Visual thesis

A sunlit shipping desk becomes a living case file: tactile kraft paper, crisp labels, black operational ink, and one cobalt approval mark create a playful world that still feels careful and trustworthy.

### Content plan

1. **Hero — establish identity and promise:** Wismo resolves “where is my order?” from inbox to answer, with autonomous sending unlocked after the safety gate.
2. **Support — show the scavenger hunt disappearing:** seven disconnected evidence sources converge into one case.
3. **Detail — demonstrate the autonomous workflow:** the parcel is scanned, matched to Shopify, checked with the courier, and answered without a human touch in gated autonomous mode.
4. **Proof — earn trust through honesty:** show the 10-case test and the two dangerous failures that changed v1.
5. **Final CTA — convert:** connect a new mailbox or log in to an existing account.

### Interaction thesis

1. **Hero entrance:** the parcel photo settles by 8px, the Wismo wordmark resolves in two beats, and an `AUTONOMOUS RESOLUTION` shipping mark lands once. Total sequence: 700–900ms.
2. **Autonomous scroll journey:** one sticky case moves through five states—received, parcel scanned, courier checked, reply sent, resolved. The parcel stays on the desk while Wismo's cobalt signal travels to the courier and returns. Scroll controls progress but never takes control away from the browser.
3. **Micro-interaction family:** CTA perforations tighten, the login rule draws, evidence labels lift to reveal their source, the scan beam reacts to pointer position within a 6px limit, and the final `RESOLVED` stamp presses once.

### What makes it feel playful

- Physical cause and effect: papers slide, the box crosses a scanner, a courier status travels back, the reply tears off, and the case gets stamped resolved.
- Small operational phrases such as `MATCH FOUND`, `NEWEST SCAN`, and `REPLY SENT` reward attention.
- Irregular label crops and oversized tracking numerals create surprise without adding extra colors or decorative widgets.
- Playfulness comes from behavior and composition, not childish type, emoji, or novelty cursor effects.

### Palette

| Token | Name | Value | Use |
|---|---|---:|---|
| `--wismo-paper` | Receipt white | `#F7F4EA` | Main page surface and labels |
| `--wismo-kraft` | Parcel kraft | `#CDAE7D` | Hero photographic field/fallback |
| `--wismo-ink` | Carbon ink | `#171714` | Primary text and rules |
| `--wismo-ink-soft` | Faded ink | `#5B594F` | Supporting text |
| `--wismo-line` | Paper edge | `#D8D1C2` | Dividers and label cuts |
| `--wismo-signal` | Approval cobalt | `#2457FF` | The only accent: CTA, verification, focus, approval |

Use semantic error treatment through black strike-through, a mismatch icon, and explicit text; do not introduce a second red accent.

### Typography

- **Archivo Variable:** brand, headlines, body, navigation, buttons. Use 400, 550, 700, and 900 weights.
- **IBM Plex Mono:** tracking numbers, timestamps, evidence labels, eyebrow copy, and test data.
- Load both through `next/font/google` and expose them as CSS variables. No third font.

### Signature element

The page is remembered for one oversized shipping label that starts on a real parcel and passes under Wismo's cobalt scan beam. The parcel stays put while a cobalt Wismo signal travels to a courier checkpoint, returns with the newest status, and becomes a sent customer reply. The same order and tracking IDs persist throughout, so the site behaves like one continuous autonomous resolution.

### Composition sketch

```text
DESKTOP / FIRST VIEWPORT — ONE FULL-BLEED COMPOSITION
┌────────────────────────────────────────────────────────────────────────────┐
│ WISMO.ai                               How it works   Log in  [CONNECT →]  │
│                                                                            │
│ WISMO.ai                                                                   │
│ Where is my order?                      [real parcel / label photography]  │
│ Wismo resolves it.                      [tracking ID under scan line]       │
│                                         [AUTONOMOUS RESOLUTION stamp]       │
│                                                                            │
│ One precise sentence. [ CONNECT SUPPORT MAILBOX ]  Log in                  │
│ V1 approval mode · Autonomy unlocks by safety gate                         │
└────────────────────────────────────────────────────────────────────────────┘

SCROLL NARRATIVE
┌─────────────────────────────┬──────────────────────────────────────────────┐
│ Watch one order answer      │  sticky parcel moving through five states   │
│ itself.                     │  receive → scan → courier → reply → resolve  │
│                             │  AUTONOMOUS MODE · AFTER SAFETY GATE         │
└─────────────────────────────┴──────────────────────────────────────────────┘
```

On mobile, the image stays first-viewport dominant behind the text; the sticky sequence becomes five stacked journey moments with no pinning.

---

## 2. Final Page Copy

### Navigation

- Brand: `WISMO.ai`
- Anchor: `How it works`
- Primary action: `Connect support mailbox`
- Secondary action: `Log in`

### Hero — one job: promise

- Eyebrow: `AUTONOMOUS WISMO RESOLUTION FOR SHOPIFY`
- Brand: `WISMO.ai`
- Headline: `Where is my order? Wismo resolves it.`
- Body: `Wismo finds the right order, verifies the newest courier scan, and sends the answer in your brand voice—autonomously after that case type clears your safety gate. V1 keeps manager approval on while that proof is built.`
- CTA: `Connect support mailbox`
- Secondary CTA: `Log in`
- CTA note: `Google sign-in · V1 approval mode · Autonomy unlocks by safety gate`
- Image alt: `A parcel and shipping label arranged as an evidence desk for an order support case.`

### Support — one job: make the manual pain concrete

- Eyebrow: `ONE SMALL EMAIL`
- Headline: `One “where is my order?” email. Seven places to look.`
- Body: `Wismo pulls the customer, order, fulfillment, tracking, prior emails, linked cases, and courier replies into one traceable case.`
- Evidence labels: `CUSTOMER`, `ORDER`, `FULFILLMENT`, `TRACKING`, `PAST EMAILS`, `LINKED CASES`, `COURIER REPLIES`

### Detail — one job: demonstrate autonomous resolution

- Mode label: `AUTONOMOUS MODE · AFTER SAFETY GATE`
- Eyebrow: `ONE QUESTION. ZERO HANDOFFS.`
- Headline: `Watch one order answer itself.`
- Step 1 label: `RECEIVE`
- Step 1 title: `The question lands.`
- Step 1 body: `Wismo recognizes the WISMO request in the shared support inbox and opens a case.`
- Step 2 label: `SCAN`
- Step 2 title: `Wismo finds the right order.`
- Step 2 body: `A cobalt scan crosses the parcel while Wismo matches the sender, Shopify order, fulfillment, and exact tracking number.`
- Step 3 label: `CHECK COURIER`
- Step 3 title: `The latest status comes back.`
- Step 3 body: `Wismo checks the courier, rejects mismatched tracking, sorts scans by event time, and returns the newest valid status.`
- Step 4 label: `REPLY`
- Step 4 title: `The customer gets the answer.`
- Step 4 body: `Wismo writes in the store’s voice and sends the verified update without handing the case to a person.`
- Step 5 label: `RESOLVE`
- Step 5 title: `The case closes itself.`
- Step 5 body: `The reply, sources, actions, and timestamps stay attached to the case until delivery is confirmed.`

### Proof — one job: build credibility without invented social proof

- Eyebrow: `THE TEST THAT CHANGED V1`
- Headline: `Two bad answers were enough to stop autonomous sending.`
- Body: `In the first 10-case test, six passed, two needed human review, and two failed dangerously. That is why messages and Shopify changes require manager approval in v1.`
- Data labels: `6 PASSED`, `2 REVIEWED`, `2 STOPPED`
- Gate note: `Autonomy stays off until a larger representative test reaches at least 90% without manager correction and produces zero dangerous failures.`

### Final CTA — one job: convert

- Eyebrow: `AUTONOMOUS WISMO RESOLUTION`
- Headline: `Turn WISMO questions into finished work.`
- Body: `Connect the shared support inbox. Wismo finds the order, checks the courier, and completes the reply.`
- CTA: `Connect support mailbox`
- Secondary CTA: `Log in`
- CTA note: `Google sign-in opens the connection flow.`
- Safety note: `V1 requires manager approval. Autonomous sending unlocks only after the safety gate is met.`
- Scope note: `Built for Gmail + Shopify WISMO cases. Email only in v1.`

### Metadata

- Title: `Wismo.ai — Autonomous WISMO resolution for Shopify`
- Description: `Wismo finds the right Shopify order, verifies the newest courier status, and resolves “where is my order?” emails. Autonomous sending unlocks by safety gate.`

### Tested alternatives

- Headline B: `Your customer asks. Wismo finds out and replies.` — more conversational, less category-specific.
- Headline C: `Autonomous answers for every “where is my order?”` — explicit proposition, less playful rhythm.
- CTA B: `Connect shared Gmail` — more specific, but the approved scoping language is stronger and should remain primary.

---

## 3. Research Decisions

- [Gorgias](https://www.gorgias.com/ai-agent) and [Siena](https://www.siena.cx/) sell broad, autonomous commerce agents. Wismo should own the narrower promise of end-to-end autonomous WISMO resolution, differentiated by exact tracking validation and a safety-gated rollout.
- [Loop](https://www.loopreturns.com/solutions/post-purchase/) focuses on proactive post-purchase tracking and ticket reduction. Wismo's page should focus on resolving an inbound case safely, not a branded tracking portal.
- Shipping labels provide a real visual grammar—hierarchy, barcodes, timestamps, routing marks—and are more product-specific than generic dashboards. The [shipping-label reference collection](https://dribbble.com/tags/shipping-label) is useful for material and crop studies only, not layout copying.
- Editorial SaaS references work when the editorial language reflects the product. The [Pulse case study](https://quirzy.com/case-studies/pulse) supports the anti-template principle, but Wismo uses parcel evidence instead of terminal graphics.
- Current Motion for React is installed as `motion` and imported from `motion/react`; its official Next.js guidance supports a small client boundary. See [installation](https://motion.dev/docs/react-installation) and [scroll animation](https://motion.dev/docs/react-scroll-animations).
- The UI database returned a brutalist card-heavy showcase. Keep its accessibility guidance, but reject its card grid, green/orange palette, Rubik/Nunito pairing, and instant transitions because they do not fit the brief.

---

## 4. File Map

```text
web/
├── package.json                                  # add Motion dependency
├── package-lock.json                             # lock dependency
├── public/landing/
│   ├── evidence-desk-hero.avif                   # full-bleed parcel photograph
│   ├── evidence-desk-hero-mobile.avif            # mobile crop with calm text area
│   └── paper-grain.webp                          # subtle real paper texture, under 80 KB
└── src/app/
    ├── layout.tsx                                # font variables and global metadata
    ├── page.tsx                                  # server-rendered narrative composition
    ├── page.module.css                           # replace old landing styles completely
    ├── opengraph-image.tsx                       # generated Wismo shipping-label share image
    ├── login/
    │   ├── layout.tsx                            # reuse Convex Google-auth providers
    │   ├── page.tsx                              # existing-user entry route
    │   ├── LoginForm.tsx                         # Google sign-in, redirect to inbox
    │   └── login.module.css                      # focused login composition
    └── landing/
        ├── content.ts                            # typed, approved copy and evidence data
        ├── content.test.ts                       # safety and CTA contract tests
        ├── EvidenceHero.tsx                      # client-only hero entrance
        ├── AutonomousJourney.tsx                 # client-only scroll-linked resolution
        └── LandingNav.tsx                        # compact overlay navigation
```

Do not import from the current landing components or `public/visuals`. Leave `/connect`, `/inbox`, and `/support-web` unchanged; add `/login` as a focused existing-user route.

---

### Task 1: Lock the claims and conversion contract

**Files:**
- Create: `src/app/landing/content.ts`
- Create: `src/app/landing/content.test.ts`

**Interfaces:**
- Produces: `landingContent`, `JourneyStep`, and `LandingContent` for every page component.
- Guarantees: primary CTAs use `/connect`, secondary actions use `/login`, autonomous resolution is prominent, and the v1 approval boundary remains explicit.

- [ ] **Step 1: Write the failing content contract test**

```ts
import { describe, expect, it } from "vitest";
import { landingContent } from "./content";

describe("landingContent", () => {
  it("keeps the new-user and existing-user paths consistent", () => {
    expect(landingContent.hero.cta).toEqual({
      label: "Connect support mailbox",
      href: "/connect",
    });
    expect(landingContent.finalCta.cta).toEqual(landingContent.hero.cta);
    expect(landingContent.hero.secondaryCta).toEqual({
      label: "Log in",
      href: "/login",
    });
    expect(landingContent.finalCta.secondaryCta).toEqual(
      landingContent.hero.secondaryCta,
    );
  });

  it("leads with autonomy while stating the v1 boundary", () => {
    const copy = JSON.stringify(landingContent);
    expect(copy).toMatch(/autonomous/i);
    expect(copy).toMatch(/after safety gate/i);
    expect(copy).toMatch(/manager approval/i);
  });

  it("contains the complete autonomous journey", () => {
    expect(landingContent.journeySteps.map((step) => step.label)).toEqual([
      "RECEIVE",
      "SCAN",
      "CHECK COURIER",
      "REPLY",
      "RESOLVE",
    ]);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd web && npm test -- src/app/landing/content.test.ts`

Expected: FAIL because `./content` does not exist.

- [ ] **Step 3: Create the typed content source**

```ts
export type JourneyStep = {
  label: "RECEIVE" | "SCAN" | "CHECK COURIER" | "REPLY" | "RESOLVE";
  title: string;
  body: string;
};

export type LandingContent = {
  hero: {
    eyebrow: string;
    brand: string;
    headline: string;
    body: string;
    cta: { label: string; href: "/connect" };
    secondaryCta: { label: string; href: "/login" };
    note: string;
  };
  support: {
    eyebrow: string;
    headline: string;
    body: string;
    labels: string[];
  };
  journey: {
    modeLabel: string;
    eyebrow: string;
    headline: string;
  };
  journeySteps: JourneyStep[];
  proof: {
    eyebrow: string;
    headline: string;
    body: string;
    results: Array<"PASSED" | "REVIEWED" | "STOPPED">;
    gateNote: string;
  };
  finalCta: {
    eyebrow: string;
    headline: string;
    body: string;
    cta: { label: string; href: "/connect" };
    secondaryCta: { label: string; href: "/login" };
    note: string;
    safetyNote: string;
    scopeNote: string;
  };
};

export const landingContent: LandingContent = {
  hero: {
    eyebrow: "AUTONOMOUS WISMO RESOLUTION FOR SHOPIFY",
    brand: "WISMO.ai",
    headline: "Where is my order? Wismo resolves it.",
    body:
      "Wismo finds the right order, verifies the newest courier scan, and sends the answer in your brand voice—autonomously after that case type clears your safety gate. V1 keeps manager approval on while that proof is built.",
    cta: { label: "Connect support mailbox", href: "/connect" },
    secondaryCta: { label: "Log in", href: "/login" },
    note: "Google sign-in · V1 approval mode · Autonomy unlocks by safety gate",
  },
  support: {
    eyebrow: "ONE SMALL EMAIL",
    headline: "One “where is my order?” email. Seven places to look.",
    body:
      "Wismo pulls the customer, order, fulfillment, tracking, prior emails, linked cases, and courier replies into one traceable case.",
    labels: [
      "CUSTOMER",
      "ORDER",
      "FULFILLMENT",
      "TRACKING",
      "PAST EMAILS",
      "LINKED CASES",
      "COURIER REPLIES",
    ],
  },
  journey: {
    modeLabel: "AUTONOMOUS MODE · AFTER SAFETY GATE",
    eyebrow: "ONE QUESTION. ZERO HANDOFFS.",
    headline: "Watch one order answer itself.",
  },
  journeySteps: [
    {
      label: "RECEIVE",
      title: "The question lands.",
      body:
        "Wismo recognizes the WISMO request in the shared support inbox and opens a case.",
    },
    {
      label: "SCAN",
      title: "Wismo finds the right order.",
      body:
        "A cobalt scan crosses the parcel while Wismo matches the sender, Shopify order, fulfillment, and exact tracking number.",
    },
    {
      label: "CHECK COURIER",
      title: "The latest status comes back.",
      body:
        "Wismo checks the courier, rejects mismatched tracking, sorts scans by event time, and returns the newest valid status.",
    },
    {
      label: "REPLY",
      title: "The customer gets the answer.",
      body:
        "Wismo writes in the store’s voice and sends the verified update without handing the case to a person.",
    },
    {
      label: "RESOLVE",
      title: "The case closes itself.",
      body:
        "The reply, sources, actions, and timestamps stay attached to the case until delivery is confirmed.",
    },
  ],
  proof: {
    eyebrow: "THE TEST THAT CHANGED V1",
    headline: "Two bad answers were enough to stop autonomous sending.",
    body:
      "In the first 10-case test, six passed, two needed human review, and two failed dangerously. That is why messages and Shopify changes require manager approval in v1.",
    results: [
      "PASSED",
      "PASSED",
      "PASSED",
      "PASSED",
      "PASSED",
      "PASSED",
      "REVIEWED",
      "REVIEWED",
      "STOPPED",
      "STOPPED",
    ],
    gateNote:
      "Autonomy stays off until a larger representative test reaches at least 90% without manager correction and produces zero dangerous failures.",
  },
  finalCta: {
    eyebrow: "AUTONOMOUS WISMO RESOLUTION",
    headline: "Turn WISMO questions into finished work.",
    body:
      "Connect the shared support inbox. Wismo finds the order, checks the courier, and completes the reply.",
    cta: { label: "Connect support mailbox", href: "/connect" },
    secondaryCta: { label: "Log in", href: "/login" },
    note: "Google sign-in opens the connection flow.",
    safetyNote:
      "V1 requires manager approval. Autonomous sending unlocks only after the safety gate is met.",
    scopeNote: "Built for Gmail + Shopify WISMO cases. Email only in v1.",
  },
};
```

- [ ] **Step 4: Run the focused test**

Run: `cd web && npm test -- src/app/landing/content.test.ts`

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/landing/content.ts web/src/app/landing/content.test.ts
git commit -m "test: lock Wismo landing claims and CTA"
```

---

### Task 2: Produce the Evidence Desk image system

**Files:**
- Create: `public/landing/evidence-desk-hero.avif`
- Create: `public/landing/evidence-desk-hero-mobile.avif`
- Create: `public/landing/paper-grain.webp`

**Interfaces:**
- Produces: desktop `2400×1600`, mobile `1200×1600`, and tileable `512×512` optimized assets.
- Consumed by: `page.tsx` through `next/image` and `page.module.css` as a low-opacity texture.

- [ ] **Step 1: Generate or photograph the hero source**

Use this exact production brief:

```text
Editorial overhead photograph of a real ecommerce support evidence desk in soft
late-afternoon daylight. One kraft parcel occupies the right two-thirds. A crisp,
unbranded shipping label, barcode, courier scan slip, and a short email printout
overlap naturally. The left third is calm dark-kraft negative space for white
headline text. One small cobalt-blue approval stamp is the only saturated color.
Tactile paper fibers, believable shadows, premium magazine art direction, playful
cropping, no people, no laptop, no UI frame, no legible address, no company logo,
no extra colors, no gradient, no split screen, 3:2 landscape.
```

- [ ] **Step 2: Create the mobile art-directed crop**

Crop vertically so the parcel occupies the lower 58%, the upper 42% stays calm enough for the brand and headline, and the approval mark remains visible. Do not use CSS `object-position` alone when it cuts off the label story.

- [ ] **Step 3: Export and validate assets**

Targets:

```text
evidence-desk-hero.avif        <= 420 KB
evidence-desk-hero-mobile.avif <= 300 KB
paper-grain.webp               <= 80 KB
```

Open each final asset at 100% and reject embedded text artifacts, fake logos, unreadable pseudo-addresses, or plastic-looking paper.

- [ ] **Step 4: Commit**

```bash
git add web/public/landing
git commit -m "assets: add Wismo evidence desk photography"
```

---

### Task 3: Install Motion and establish route-level identity

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/layout.tsx`
- Create: `src/app/opengraph-image.tsx`

**Interfaces:**
- Produces: `--font-archivo` and `--font-plex-mono` CSS variables on `<body>`.
- Produces: static metadata and a 1200×630 shipping-label share image.
- Consumed by: landing CSS and motion components.

- [ ] **Step 1: Install Motion for React**

Run: `cd web && npm install motion@^13.1.0`

Expected: `motion` appears in dependencies and the lockfile changes.

- [ ] **Step 2: Configure the two font variables**

```tsx
import { Archivo, IBM_Plex_Mono } from "next/font/google";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});
```

Add both variables to the existing body class without removing behavior required by product routes.

- [ ] **Step 3: Set honest static metadata**

```ts
export const metadata: Metadata = {
  title: "Wismo.ai — Autonomous WISMO resolution for Shopify",
  description:
    "Wismo finds the right Shopify order, verifies the newest courier status, and resolves ‘where is my order?’ emails. Autonomous sending unlocks by safety gate.",
};
```

- [ ] **Step 4: Create the Open Graph image**

Use `ImageResponse` with flexbox only: receipt-white background, `WISMO.ai` at top left, oversized `ORDER QUESTION / RESOLVED`, a barcode made from narrow black flex children, and one cobalt `AUTONOMOUS WISMO` mark. Add the small qualifier `UNLOCKS BY SAFETY GATE`. Export `size = { width: 1200, height: 630 }` and `contentType = "image/png"`.

- [ ] **Step 5: Verify type and build**

Run: `cd web && npm run lint && npm run build`

Expected: both commands exit 0 and metadata generation succeeds.

- [ ] **Step 6: Commit**

```bash
git add web/package.json web/package-lock.json web/src/app/layout.tsx web/src/app/opengraph-image.tsx
git commit -m "feat: establish Wismo landing identity"
```

---

### Task 4: Build the full-bleed hero composition

**Files:**
- Create: `src/app/landing/LandingNav.tsx`
- Create: `src/app/landing/EvidenceHero.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css`

**Interfaces:**
- `LandingNav({ cta, secondaryCta }: { cta: { label: string; href: "/connect" }; secondaryCta: { label: string; href: "/login" } })`
- `EvidenceHero({ content }: { content: LandingContent["hero"] })`
- `page.tsx` remains a Server Component and passes serializable copy into the client hero.

- [ ] **Step 1: Replace the old page composition with semantic landmarks**

```tsx
export default function HomePage() {
  return (
    <>
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>
      <LandingNav
        cta={landingContent.hero.cta}
        secondaryCta={landingContent.hero.secondaryCta}
      />
      <main id="main-content" className={styles.page}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <EvidenceHero content={landingContent.hero} />
        </section>
      </main>
    </>
  );
}
```

Tasks 5 and 6 append the remaining sections. This task's hero-only intermediate state must build cleanly and is not the release state.

- [ ] **Step 2: Build the navigation as an overlay**

Use real links for `/connect`, `/login`, `#how-it-works`, and the brand. `Log in` is a quiet text action directly before the primary button. Keep desktop nav at 64px tall and mobile at 56px. The overlay must not add height above the hero.

- [ ] **Step 3: Build the hero client boundary**

```tsx
"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { LandingContent } from "./content";
import styles from "../page.module.css";

type EvidenceHeroProps = {
  content: LandingContent["hero"];
};

export function EvidenceHero({ content }: EvidenceHeroProps) {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : { opacity: 0, y: 12 };

  return (
    <div className={styles.heroStage}>
      <HeroPicture />
      <div className={styles.heroShade} aria-hidden="true" />
      <motion.div initial={initial} animate={{ opacity: 1, y: 0 }} className={styles.heroCopy}>
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <p className={styles.heroBrand}>{content.brand}</p>
        <h1 id="hero-title">{content.headline}</h1>
        <p>{content.body}</p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryCta} href={content.cta.href}>{content.cta.label}</Link>
          <Link className={styles.loginCta} href={content.secondaryCta.href}>{content.secondaryCta.label}</Link>
        </div>
        <small>{content.note}</small>
        <motion.span
          aria-hidden="true"
          className={styles.autonomyStamp}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.08, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ delay: 0.55, type: "spring", stiffness: 360, damping: 24 }}
        >
          AUTONOMOUS RESOLUTION
        </motion.span>
      </motion.div>
    </div>
  );
}
```

Implement `HeroPicture` with Next.js 16 art direction so the browser downloads only the matching crop:

```tsx
function HeroPicture() {
  const common = {
    alt: "A parcel and shipping label arranged as an evidence desk for an order support case.",
    sizes: "100vw",
  };
  const { props: { srcSet: desktop } } = getImageProps({
    ...common,
    src: "/landing/evidence-desk-hero.avif",
    width: 2400,
    height: 1600,
    quality: 78,
  });
  const { props: { srcSet: mobile, ...rest } } = getImageProps({
    ...common,
    src: "/landing/evidence-desk-hero-mobile.avif",
    width: 1200,
    height: 1600,
    quality: 74,
    fetchPriority: "high",
  });

  return (
    <picture className={styles.heroPicture}>
      <source media="(min-width: 768px)" srcSet={desktop} />
      <source media="(max-width: 767px)" srcSet={mobile} />
      <img {...rest} className={styles.heroImage} />
    </picture>
  );
}
```

Do not use the deprecated `priority` prop in Next.js 16.

- [ ] **Step 4: Implement hero styling from tokens**

Key requirements:

```css
:global(:root) {
  --wismo-paper: #f7f4ea;
  --wismo-kraft: #cdae7d;
  --wismo-ink: #171714;
  --wismo-ink-soft: #5b594f;
  --wismo-line: #d8d1c2;
  --wismo-signal: #2457ff;
}
.hero { position: relative; min-height: 100svh; overflow: clip; background: var(--wismo-kraft); }
.heroPicture, .heroImage { position: absolute; inset: 0; width: 100%; height: 100%; }
.heroImage { object-fit: cover; }
.heroBrand { font: 900 clamp(4.5rem, 11vw, 10rem)/0.78 var(--font-archivo); letter-spacing: -0.075em; }
.heroCopy { position: relative; z-index: 2; width: min(38rem, calc(100% - 2rem)); }
.primaryCta { min-height: 44px; display: inline-flex; align-items: center; }
```

Anchor the text left on desktop and top-left on mobile over a verified calm image area. Maintain at least 4.5:1 text contrast with a localized ink overlay, not a decorative gradient.

- [ ] **Step 5: Verify first-viewport rules**

At 1440×900 and 390×844 confirm: the whole first viewport reads as one image-led composition; `WISMO.ai` is the loudest text; autonomous resolution, both entry actions, and the v1 qualifier are visible without scrolling; no card silhouette appears.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/page.tsx web/src/app/page.module.css web/src/app/landing/LandingNav.tsx web/src/app/landing/EvidenceHero.tsx
git commit -m "feat: build full-bleed Wismo evidence hero"
```

---

### Task 5: Build the interactive autonomous resolution journey

**Files:**
- Create: `src/app/landing/AutonomousJourney.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css`

**Interfaces:**
- `AutonomousJourney({ journey, steps }: { journey: LandingContent["journey"]; steps: JourneyStep[] })`
- Consumes: the same fictional case identifiers throughout: order `#1048`, valid tracking `FR-482-991`, rejected tracking `FR-291-118`.
- Produces: five readable steps and one continuous zero-touch visual journey clearly labeled as post-safety-gate autonomous mode.

- [ ] **Step 1: Build the support section without cards**

Render the headline and one continuous horizontal evidence strip. On desktop, labels overlap like paper tabs; on mobile, they wrap as plain ruled rows. Each label stays text, not an icon. Hover and keyboard focus lift a label 3px and reveal its source line; touch opens the same line on tap.

Append the complete journey after the support strip:

```tsx
<AutonomousJourney
  journey={landingContent.journey}
  steps={landingContent.journeySteps}
/>
```

- [ ] **Step 2: Implement scroll progress**

```tsx
"use client";

import {
  motion,
  useMotionValueEvent,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { JourneyStep, LandingContent } from "./content";
import styles from "../page.module.css";

type AutonomousJourneyProps = {
  journey: LandingContent["journey"];
  steps: JourneyStep[];
};

export function AutonomousJourney({ journey, steps }: AutonomousJourneyProps) {
  const root = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const pointerX = useMotionValue(0);
  const scanNudge = useSpring(pointerX, { stiffness: 420, damping: 32 });
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start start", "end end"],
  });

  const boxX = useTransform(
    scrollYProgress,
    [0, 0.2, 0.45, 0.72, 1],
    ["-16%", "0%", "0%", "0%", "0%"],
  );
  const scanY = useTransform(scrollYProgress, [0.16, 0.34], ["-70%", "70%"]);
  const scanOpacity = useTransform(scrollYProgress, [0.12, 0.18, 0.34, 0.4], [0, 1, 1, 0]);
  const courierLine = useTransform(scrollYProgress, [0.38, 0.58], [0, 1]);
  const agentX = useTransform(scrollYProgress, [0.38, 0.58, 0.66], ["0%", "240%", "0%"]);
  const agentOpacity = useTransform(scrollYProgress, [0.34, 0.4, 0.64, 0.7], [0, 1, 1, 0]);
  const courierOpacity = useTransform(scrollYProgress, [0.34, 0.44, 0.65, 0.72], [0, 1, 1, 0]);
  const replyX = useTransform(scrollYProgress, [0.66, 0.86], ["42%", "0%"]);
  const replyOpacity = useTransform(scrollYProgress, [0.62, 0.72, 0.88, 0.94], [0, 1, 1, 0]);
  const resolvedScale = useTransform(scrollYProgress, [0.84, 0.96], [1.12, 1]);
  const resolvedOpacity = useTransform(scrollYProgress, [0.82, 0.92], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const next = Math.min(4, Math.floor(latest * 5));
    setActiveStep((current) => (current === next ? current : next));
  });

  function nudgeScanner(event: ReactPointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalized = (event.clientX - bounds.left) / bounds.width - 0.5;
    pointerX.set(normalized * 12);
  }

  return (
    <section ref={root} className={styles.sequence} aria-labelledby="workflow-title">
      <div className={styles.sequenceCopy}>
        <p className={styles.modeLabel}>{journey.modeLabel}</p>
        <p className={styles.eyebrow}>{journey.eyebrow}</p>
        <h2 id="workflow-title">{journey.headline}</h2>
        <ol>
          {steps.map((step, index) => (
            <li key={step.label} data-active={activeStep === index}>
              <span>{step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <StaticJourneyFrame label={step.label} />
            </li>
          ))}
        </ol>
      </div>

      <div
        className={styles.journeyViewport}
        aria-hidden="true"
        onPointerMove={nudgeScanner}
        onPointerLeave={() => pointerX.set(0)}
      >
        <div className={styles.journeyStage}>
          <span className={styles.inboxSlip}>WHERE IS ORDER #1048?</span>
          <motion.div className={styles.parcel} style={reduceMotion ? undefined : { x: boxX }}>
            <span>ORDER #1048</span>
            <b>FR-482-991</b>
          </motion.div>
          <motion.i
            className={styles.scanBeam}
            style={reduceMotion ? undefined : { x: scanNudge, y: scanY, opacity: scanOpacity }}
          />
          <motion.div className={styles.courierRoute} style={reduceMotion ? undefined : { scaleX: courierLine }} />
          <motion.span
            className={styles.agentSignal}
            style={reduceMotion ? undefined : { x: agentX, opacity: agentOpacity }}
          >
            W
          </motion.span>
          <motion.div className={styles.courierDesk} style={reduceMotion ? undefined : { opacity: courierOpacity }}>
            <span>COURIER CHECKPOINT</span>
            <strong>DELIVERY ATTEMPTED · 14:42</strong>
          </motion.div>
          <motion.div className={styles.sentReply} style={reduceMotion ? undefined : { x: replyX, opacity: replyOpacity }}>
            <span>REPLY SENT</span>
            <p>The courier tried to deliver your parcel today and will try again tomorrow.</p>
          </motion.div>
          <motion.strong className={styles.resolvedStamp} style={reduceMotion ? undefined : { scale: resolvedScale, opacity: resolvedOpacity }}>
            RESOLVED AUTONOMOUSLY
          </motion.strong>
        </div>
      </div>
    </section>
  );
}

const staticFrameCopy: Record<JourneyStep["label"], string> = {
  RECEIVE: "Email received · Order #1048",
  SCAN: "Wismo scan · Tracking FR-482-991 matched",
  "CHECK COURIER": "Courier status · Delivery attempted · 14:42",
  REPLY: "Verified update · Reply sent",
  RESOLVE: "Case #1048 · Resolved autonomously",
};

function StaticJourneyFrame({ label }: { label: JourneyStep["label"] }) {
  return (
    <div className={styles.staticJourneyFrame} aria-hidden="true">
      <span>{staticFrameCopy[label]}</span>
    </div>
  );
}
```

Use progress only for decorative transforms and active visual emphasis. Never hide the prose from assistive technology or require scroll position to access it. The section is `min-height: 500svh`; the stage is sticky, not the document scroll.

- [ ] **Step 3: Choreograph the five visual states**

```text
RECEIVE        email slip enters; parcel label adopts order #1048
SCAN           cobalt beam sweeps the box; FR-482-991 locks; FR-291-118 is rejected
CHECK COURIER  parcel stays put; cobalt Wismo signal travels out; latest status returns
REPLY          reply sheet types in, tears free, and moves toward the customer side
RESOLVE        case closes with one physical RESOLVED AUTONOMOUSLY stamp
```

The sticky desktop panel occupies at most 62% of the viewport width. Use `position: sticky; top: 8vh`; never pin the entire page, fake momentum, or alter native scrollbar behavior. Use only `transform` and `opacity` during scroll; do not animate width, height, top, or left.

- [ ] **Step 4: Add the reduced-motion/mobile layout**

```css
@media (max-width: 767px), (prefers-reduced-motion: reduce) {
  .journeyViewport { display: none; }
  .sequenceCopy li { opacity: 1; transform: none; }
  .staticJourneyFrame { display: block; }
}
```

Set `.staticJourneyFrame { display: none; }` above the media query. On mobile and reduced motion, hide `.journeyViewport` and render each visual state directly beneath its matching text as five static frames. Keep evidence IDs wrap-safe with `overflow-wrap: anywhere`; never show an empty sticky stage.

- [ ] **Step 5: Verify the narrative**

Scan only the headings and labels. The reader must understand `receive → scan → courier → reply → resolved` without reading body copy. The mode label must stay visible throughout so the zero-touch demo is never confused with current v1 approval mode.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/landing/AutonomousJourney.tsx web/src/app/page.tsx web/src/app/page.module.css
git commit -m "feat: add autonomous Wismo scroll journey"
```

---

### Task 6: Add transparent proof, dual conversion, and micro-interactions

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css`

**Interfaces:**
- Consumes: proof and final CTA copy from `landingContent` only.
- Produces: a 10-mark test visualization, repeated `/connect` and `/login` actions, and one consistent interaction language.

- [ ] **Step 1: Build the test result as ten physical marks**

Render ten `<li>` elements in one ordered list: six `PASSED`, two `REVIEWED`, and two `STOPPED`. Use the same cobalt accent for selected/verified marks; use pattern, strike-through, and text labels so meaning never relies on color.

```tsx
const results = landingContent.proof.results;

<ol className={styles.testMarks} aria-label="Results from the first ten-case test">
  {results.map((result, index) => (
    <li key={index} data-result={result}>
      <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <span>{result}</span>
    </li>
  ))}
</ol>
```

- [ ] **Step 2: Add the safety gate copy directly below the marks**

Use the exact proof copy from section 2. Do not soften `two failed dangerously`, and do not present `90%` as achieved.

- [ ] **Step 3: Build the final CTA as a full-width shipping manifest**

Keep one headline, one sentence, the primary `/connect` button, the secondary `/login` text action, and three short notes. Do not add pricing, email capture, demo booking, or any third action.

- [ ] **Step 4: Add tactile hover/focus feedback**

Use the same physical rules everywhere:

```css
.primaryCta,
.evidenceTab,
.resolvedStamp { transition: transform 160ms ease, box-shadow 160ms ease; }
.primaryCta:hover,
.primaryCta:focus-visible,
.evidenceTab:hover,
.evidenceTab:focus-visible { transform: translateY(-3px) rotate(-0.35deg); }
.primaryCta:active { transform: translateY(1px) scale(0.985); }
.loginCta { background-size: 0 1px; transition: background-size 180ms ease; }
.loginCta:hover,
.loginCta:focus-visible { background-size: 100% 1px; }
:where(a, button):focus-visible { outline: 3px solid var(--wismo-signal); outline-offset: 3px; }
```

The scan beam may follow the pointer by at most 6px while the journey stage is hovered; it snaps back on pointer leave and is disabled for touch and reduced motion. Motion should not run continuously when the user is idle.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/page.tsx web/src/app/page.module.css
git commit -m "feat: add transparent proof and final CTA"
```

---

### Task 7: Add existing-user login

**Files:**
- Create: `src/app/login/layout.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/LoginForm.tsx`
- Create: `src/app/login/login.module.css`

**Interfaces:**
- Consumes: `ConvexClientProvider` from `src/app/connect/ConvexClientProvider.tsx` and Google auth from `@convex-dev/auth/react`.
- Produces: `/login`, which returns authenticated users to `/inbox` and starts Google sign-in for signed-out users.

- [ ] **Step 1: Wrap the route with the existing auth providers**

```tsx
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { ReactNode } from "react";
import { ConvexClientProvider } from "../connect/ConvexClientProvider";

export default function LoginLayout({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return children;
  return (
    <ConvexAuthNextjsServerProvider>
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ConvexAuthNextjsServerProvider>
  );
}
```

- [ ] **Step 2: Create the server page with a safe local fallback**

```tsx
import Link from "next/link";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

export const metadata = { title: "Log in · Wismo.ai" };

export default function LoginPage() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <main className={styles.page}>
        <Link href="/">WISMO.ai</Link>
        <h1>Login needs a configured Convex environment.</h1>
        <p>The local simulation is still available through the connect flow.</p>
        <Link href="/connect">Open connect flow</Link>
      </main>
    );
  }
  return <LoginForm />;
}
```

- [ ] **Step 3: Implement Google login and authenticated redirect**

```tsx
"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./login.module.css";

export default function LoginForm() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) router.replace("/inbox");
  }, [isAuthenticated, router]);

  async function logIn() {
    setWorking(true);
    setError("");
    try {
      await signIn("google", { redirectTo: "/inbox" });
    } catch {
      setError("Google login could not start. Try again.");
      setWorking(false);
    }
  }

  return (
    <main className={styles.page}>
      <Link className={styles.brand} href="/">WISMO.ai</Link>
      <p className={styles.eyebrow}>EXISTING WORKSPACE</p>
      <h1>Welcome back.</h1>
      <p>Log in with the Google account connected to your Wismo workspace.</p>
      <button type="button" onClick={logIn} disabled={working || isLoading}>
        {working || isLoading ? "Opening Wismo…" : "Log in with Google"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      <Link href="/connect">Connecting a new mailbox?</Link>
    </main>
  );
}
```

- [ ] **Step 4: Style and verify the login route**

Keep the same paper, ink, cobalt, Archivo, and IBM Plex Mono system, but use a single centered shipping label rather than replaying the landing-page hero. Verify signed-out Google login redirects to `/inbox`, authenticated visits immediately replace to `/inbox`, failure copy receives focus or is announced, and the button remains at least 44px high.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/login
git commit -m "feat: add existing-user Wismo login"
```

---

### Task 8: Validate accessibility, performance, and release claims

**Files:**
- Modify only if checks fail: files created or changed in Tasks 1–7

**Interfaces:**
- Consumes: final landing page implementation.
- Produces: a shippable page with no broken routes or unsupported claims.

- [ ] **Step 1: Run automated checks**

Run:

```bash
cd web
npm test
npm run lint
npm run build
```

Expected: all three commands exit 0.

- [ ] **Step 2: Test the conversion path**

Start the app with `cd web && npm run dev`. Activate both `Connect support mailbox` links and both `Log in` links by mouse and keyboard. Expected: connect actions navigate to `/connect`; login actions navigate to `/login`; authenticated login returns to `/inbox`.

- [ ] **Step 3: Test keyboard and screen-reader structure**

Tab through the page. Expected order: skip link, nav anchor, nav login, nav connect, hero connect, hero login, evidence labels, final connect, final login. Every focus state is visible. Inspect the accessibility tree: one `<h1>`, section headings in order, decorative journey art and stamps hidden, hero image alt present, 10-case result has a useful list label.

- [ ] **Step 4: Test reduced motion**

Enable operating-system reduced motion and reload. Expected: all copy and all five journey frames are visible, there is no parallax, sticky transform, scan sweep, or pointer-follow effect, no content starts at opacity 0, and CTA feedback remains an instant state change.

- [ ] **Step 5: Test scroll choreography and micro-interactions**

Scroll the journey to 0%, 25%, 50%, 75%, and 100%. Expected states: received email, scanned parcel, courier result, sent reply, autonomously resolved. Confirm the mode label remains visible, scrolling stays native, reverse scrolling reverses cleanly, the scan beam follows a mouse by no more than 6px, evidence details work with keyboard focus, and pressed buttons visibly depress.

- [ ] **Step 6: Test responsive composition**

Capture screenshots at 375×812, 768×1024, 1024×768, and 1440×900. Expected: no horizontal scroll, no clipped labels, no text over busy image detail, both actions remain readable, all tap targets are at least 44px high or wide, hero still reads as one composition, and sticky behavior is disabled below 768px.

- [ ] **Step 7: Test performance**

Run Lighthouse against the production build. Targets: Performance ≥90, Accessibility ≥95, CLS <0.1, no unoptimized hero image warning, and no more than two font families. If the hero delays LCP, reduce AVIF dimensions/quality before removing the image—it is the composition's visual anchor.

- [ ] **Step 8: Audit every claim against `scoping.md`**

Search rendered copy and source for `autonomous`, `automatically`, `without review`, `90%`, and `send`. Every zero-touch claim must sit beside `after safety gate`, `autonomous mode`, or an equivalent qualifier. Every v1 claim must retain manager approval for customer messages, courier messages, and Shopify changes.

- [ ] **Step 9: Commit validation fixes**

```bash
git add web/src/app web/public/landing web/package.json web/package-lock.json
git commit -m "fix: validate Wismo landing quality and safety claims"
```

---

## 5. Final Review Checklist

- [ ] Removing the hero photograph breaks the first viewport's concept; the image is not decorative.
- [ ] `WISMO.ai` remains the strongest hero text even with navigation hidden.
- [ ] No hero card, dashboard mockup, logo cloud, pill soup, testimonial carousel, or pricing grid appears.
- [ ] The same order and tracking identifiers persist through the entire story.
- [ ] Each section has one purpose: promise, pain, workflow, proof, conversion.
- [ ] There are exactly two typefaces and one chromatic accent.
- [ ] There are exactly three purposeful motion systems.
- [ ] Autonomous resolution is unmistakable in the hero, scroll journey, metadata, and final CTA.
- [ ] The hero, proof, and final CTA state the current v1 approval boundary without interrupting the autonomous story.
- [ ] The two dangerous failures are presented as a reason for restraint, not hidden.
- [ ] No claim exceeds what `scoping.md` supports.
- [ ] Existing product routes remain untouched and `/connect` still works.
- [ ] `/login` starts Google sign-in for signed-out users and returns authenticated users to `/inbox`.
