# WISMO Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current flat landing page with a customer-centred story that sells the end state: owners stop doing repetitive order research, while their customers get fast, accurate, human-sounding help.

**Architecture:** Keep the content statically rendered, then progressively enhance it with one lazy-loaded 3D guide scene and scroll-driven transitions. Accessible HTML carries the full story; the 3D layer visualizes the same case moving through inbox, investigation, approval, and reply. JavaScript, WebGL, and reduced-motion fallbacks preserve the complete page.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, CSS Modules, `next/font`, Three.js with React Three Fiber for one lazy-loaded scene, native IntersectionObserver, semantic HTML.

**Spec:** `scoping.md` and this document's design direction.

## Global Constraints

- The page has one primary action: **Connect support mailbox**.
- The page must say that customer messages and Shopify changes require manager approval in v1.
- Do not claim autonomous resolution in v1.
- Do not add a general motion library or image carousel; the 3D scene is the only animation dependency.
- Use real WISMO workflow content; no stock photography or invented customer logos.
- Support 360px mobile width, keyboard navigation, and `prefers-reduced-motion`.
- Keep the `/connect` placeholder honest until Google sign-in exists.
- Work backwards from the customer's desired outcome before explaining the product.
- Translate every capability into a benefit for the owner or their customer.
- Customer-facing examples must sound warm and natural, never like a chatbot script.
- Every 3D state and interaction must explain the case journey or expose useful evidence.
- The initial page must remain readable and usable before the 3D bundle loads.
- Target less than 250KB compressed for the 3D scene's custom assets; use geometry and baked textures rather than heavy models.

---

## Research Summary

The comparison set is category leaders, not a conversion-rate ranking; private conversion data is not available.

### What the strongest sites do well

| Site | Pattern worth borrowing | What WISMO should avoid |
|---|---|---|
| Gorgias | Leads with ecommerce context, Shopify-native proof, concrete outcomes, and real product surfaces. Its claims are attached to a visible workflow. | Broad feature grids and large-company claims that WISMO cannot yet prove. |
| Intercom | Uses oversized typography, generous negative space, controlled color fields, and product scenes that explain the AI/human handoff. | Abstract lifestyle imagery that does not explain WISMO's narrower job. |
| Loop | Lets visitors try or picture the product in their own store, and grounds the page in familiar ecommerce objects. | Expanding into every post-purchase use case. WISMO wins by being narrow. |
| Klaviyo | Creates a strong visual world, uses moving proof and integration ecosystems, and alternates dense product moments with quiet breathing room. | Too many animated bands or competing product messages. |
| Richpanel | Shows the actual ticket, customer record, automation report, migration timeline, and measurable proof. | Guarantee language and performance claims before WISMO has customer data. |
| Re:amaze | Makes channel coverage and the shared inbox immediately understandable. | Long copy blocks and an undifferentiated catalogue of features. |

### Chosen reference blend

- **From Loop:** bold, oversized sans-serif typography; high contrast between large statements and small supporting copy; generous vertical spacing; confident section openings.
- **From Gorgias:** a product-first explanation that quickly establishes who it is for, what work it handles, how AI and people work together, and what happens inside the product.
- **WISMO's own identity:** the evidence desk and its human reply. We borrow principles, not layouts, colors, illustrations, or copy.

### Shopify Live Globe principles to adapt

The Shopify experience succeeds because its world is not decorative: live orders drive the visualization, the pinball metaphor makes global commerce playful, and interaction reveals more of the system. It uses Three.js and React Three Fiber, but Shopify also simplified physics from 3D to 2D when mobile performance suffered. WISMO should copy that discipline, not the pinball aesthetic.

- **One world, one idea:** a single WISMO case is the world the visitor explores.
- **Data creates movement:** email arrival, order match, courier scan, approval, and reply each move the scene forward.
- **Interaction reveals meaning:** hovering, tapping, or focusing an evidence object reveals its source and why it was trusted.
- **The user has a guide:** the WISMO agent narrates what it is doing in short, human sentences.
- **Performance is part of design:** use true 3D only for the guide object and case path; keep detailed product screens in HTML/CSS.
- **Mobile gets a composed journey:** no free camera or complex gestures; scroll advances the same states in a stable view.

### Shared principles

1. **Show the product early.** The visitor should understand the workflow without reading the whole page.
2. **Make the handoff visible.** AI and manager roles must look like one connected system, not two feature cards.
3. **Use proof near claims.** Exact tracking match, newest scan, approval, and recorded action are stronger than generic “AI-powered” language.
4. **Keep one visual world.** Product UI, type, color, depth, and motion should feel like one operating environment.
5. **Use motion to explain state.** Movement should show progress or causality, not decorate empty space.

Reference pages: Gorgias (`https://www.gorgias.com/`), Intercom (`https://www.intercom.com/`), Loop (`https://www.loopreturns.com/`), Klaviyo (`https://www.klaviyo.com/`), Richpanel (`https://www.richpanel.com/`), and Re:amaze (`https://www.reamaze.com/`).

---

## Visual Direction: “The Evidence Desk”

The subject is a small Shopify support team. The page's single job is to make connecting a shared mailbox feel safe and worthwhile.

The visual metaphor is a calm operations desk: customer email, Shopify order, courier tracking, and manager approval appear as physical layers in one workspace. Depth comes from overlapping planes, soft occlusion, and light—not from glass effects everywhere.

## Messaging Strategy: Work Backwards From the Better Day

The page begins with the end state, not the software. A store owner wants fewer tabs, fewer follow-ups to remember, and confidence that customers are not being ignored. Their customer wants a quick answer that is accurate, useful, and written like a thoughtful person.

### The two jobs to be done

| Audience | Current struggle | Desired outcome | WISMO's role |
|---|---|---|---|
| Store owner or support lead | Reads the email, searches Shopify, compares tracking, contacts the courier, and remembers the follow-up. | Routine delivery questions move forward without consuming the day; only uncertain decisions need attention. | Does the investigation and prepares the next action with evidence. |
| Store customer | Waits for a vague, slow, or contradictory update and may feel dismissed by automation. | Gets a fast, accurate answer that acknowledges the concern and clearly explains what happens next. | Uses the full order context to draft a warm, specific reply for approval. |

### Message hierarchy

1. **Outcome:** Get delivery questions off your daily to-do list.
2. **Customer promise:** Give shoppers a fast, accurate answer that feels considered—not automated.
3. **Method:** WISMO checks the customer, order, conversation, and newest matching tracking event.
4. **Trust:** A manager approves customer messages and Shopify changes in v1.
5. **Action:** Connect the shared support inbox where these questions already arrive.

### Feature-to-benefit translations

- `Exact tracking match` becomes `Customers get the right update for the right order`; matching is the proof.
- `Latest scan verified` becomes `No stale delivery updates`; the scan time is the proof.
- `Manager approval` becomes `Stay in control without doing the investigation yourself`; approval is the method.
- `Previous conversations retrieved` becomes `Customers do not have to repeat themselves`; conversation history is the method.
- Do not call the experience a `bot` in page copy. Show a quick, personal reply with the relevant order detail and a clear next step.

### Human reply standard

Every sample reply must acknowledge the situation, give the verified fact, explain the next step, and say when another update will arrive.

Approved sample:

> Hi Amina — I checked order #4921 for your linen overshirt. The courier tried to deliver it at 11:00 this morning and has scheduled another attempt for tomorrow. You don't need to do anything right now. I'll keep an eye on it and update you if that changes.

Avoid robotic status copy such as: `Your ticket has been processed. Delivery status: failed attempt. Please await the next tracking event.`

### Signature moment: the guided case capsule

The hero contains a small 3D “case capsule”—a tactile parcel-like object holding the customer request. As the visitor scrolls, the capsule travels along one evidence line through four environments: inbox, order match, tracking check, and approval. It opens at the end to reveal the human reply. The guide speaks beside it: `Amina asked where her order is` → `I found the right order` → `I checked the newest matching update` → `Your reply is ready to review.` This embodies WISMO's job and should be what visitors remember.

The capsule is interactive but not game-like. Pointer movement may shift its light and rotation by a few degrees. Clicking or focusing an evidence node opens its source card. The primary CTA never depends on completing the interaction.

### Palette

| Token | Hex | Role |
|---|---:|---|
| Porcelain | `#F6F7F9` | Main background; cool rather than beige |
| Carbon | `#111318` | Headlines, navigation, dark CTA |
| Slate | `#59616D` | Body copy and secondary labels |
| Cloud | `#E7EAF0` | Dividers, inactive planes, UI framing |
| Signal amber | `#FFB547` | Evidence path and attention state only |
| Verified jade | `#1E8068` | Exact match and approved state only |

Use translucent white only for elevated product planes. Avoid broad gradients; one radial cool-white light behind the hero workspace is enough.

### Typography: Loop-like confidence, WISMO-specific voice

- **Display:** Manrope, 700–800 weight. Its broad, clean forms can carry Loop-like visual confidence without copying Loop's exact face.
- **Body/UI:** Inter, 400–650 weight. It stays readable inside dense support UI.
- **Data:** IBM Plex Mono, 500 weight, only for order numbers, timestamps, and tracking IDs.
- Desktop hero: `clamp(64px, 8.2vw, 112px)`, line-height `0.91`, letter-spacing `-0.065em`, maximum width 980px.
- Section headings: `clamp(44px, 5.8vw, 76px)`, line-height `0.96`.
- Body: 18–21px in hero, 16–18px in sections, maximum 62 characters per line.
- UI labels: 11–13px; do not use all-caps except short status labels.
- Use one oversized statement per viewport. Product UI and supporting copy stay quieter so the typography retains its impact.
- Mobile hero: `clamp(48px, 14vw, 68px)` with manual line-break control only where it prevents orphaned words.

### Spacing and shape

- Content width: 1280px; readable copy width: 680px.
- Section rhythm: 144–192px desktop, 88–112px tablet, 72–88px mobile.
- 8px base spacing scale with deliberate 12px and 20px optical exceptions.
- Product planes: 18–24px radius. Buttons: 12px radius. Status pills: full radius.
- Shadows use three faint layers to create distance; never a single dark drop shadow.

### Motion system

- Hero entry: 900ms total, with the capsule settling into the inbox and the first guide message appearing after 300ms.
- Journey: one sticky 3D stage spanning four viewport-height chapters; scroll progress moves between named states rather than scrubbing every pixel.
- State transition: 500–700ms, custom cubic-bezier `(0.22, 1, 0.36, 1)`, with camera, object, and copy arriving as one beat.
- Evidence line: draw from source to source only when an exact match is established.
- Interaction: pointer parallax is limited to 4 degrees; evidence nodes respond equally to hover, tap, and keyboard focus.
- Product cards: at most 3px hover lift. No continuous floating or automatic camera orbit.
- Customer proof strip: no infinite marquee until real customer proof exists.
- Reduced motion: replace the sticky scene with four static illustrated frames and show all copy immediately.
- Low-power fallback: if WebGL creation fails, render the same static frames; do not show an error.

---

## Page Structure

```text
┌──────────────────────────────────────────────────────────────┐
│ WISMO                    How it works   Safety   Connect      │
├──────────────────────────────────────────────────────────────┤
│ Get delivery questions       ◉  3D case capsule               │
│ off your daily to-do       ╱ “Amina asked where it is.”      │
│ list.                     ╱   [Connect mailbox]                │
│ [Connect mailbox]                   │ exact match             │
│                                    ├──── order + tracking     │
│                                    └──── approval sheet       │
├──────────────────────────────────────────────────────────────┤
│ Less chasing for you. Better answers for them.               │
├──────────────────────────────────────────────────────────────┤
│ sticky guided journey: the case travels as the user scrolls  │
│ ASK ONCE  →  GET CHECKED  →  STAY IN CONTROL  →  ANSWER     │
├──────────────────────────────────────────────────────────────┤
│ Guardrails as visible evidence, not generic feature cards   │
├──────────────────────────────────────────────────────────────┤
│ Quiet final CTA: Connect one shared mailbox                  │
└──────────────────────────────────────────────────────────────┘
```

### Copy hierarchy

- Eyebrow: `A quieter support day starts here`
- Headline: `Get delivery questions off your daily to-do list.`
- Subhead: `Your customers get fast, accurate updates that feel personal. You get the full investigation and a clear next step—without searching through Shopify and courier pages yourself.`
- Primary CTA: `Connect support mailbox`
- CTA note: `Start with one shared Gmail inbox · You approve every external action in v1`
- Outcome heading: `Less chasing for you. Better answers for them.`
- Workflow heading: `From “Where is it?” to a clear answer.`
- Safety heading: `Stay in control without doing the investigation yourself.`
- Final heading: `Give your customers an answer before the question becomes a complaint.`

### Page argument, in order — adapted from Gorgias's clarity

1. **Owner outcome:** remove repetitive delivery support from the owner's day.
2. **Shared outcome:** contrast manual searching and customer waiting with one prepared decision and a clear reply.
3. **What WISMO does:** one plain sentence—`WISMO investigates delivery questions and prepares the reply.`—followed by the four-stage product workflow.
4. **Customer moment:** show the final human-sounding reply first, then reveal the evidence behind it.
5. **One system, two roles:** explain what WISMO handles and where the manager decides, using one connected product scene rather than two feature grids.
6. **Control:** frame manager approval as freedom from research without loss of judgment.
7. **Action:** connect the inbox that already receives these questions.

The visitor should be able to answer these questions after one quick scroll:

- Is this for my Shopify support workflow? Yes—delivery questions arriving by email.
- What does it take off my plate? Customer and order lookup, tracking checks, courier follow-up, reply preparation, and case memory.
- What does my customer experience? A fast, specific, human-sounding update without having to repeat their details.
- What do I still control? Every external message and Shopify change in v1.

---

## File Map

- Create `src/app/components/LandingNav.tsx`: responsive navigation and CTA.
- Create `src/app/components/EvidenceDesk.tsx`: accessible hero product scene and evidence states.
- Create `src/app/components/AgentJourney.tsx`: client controller for scroll states, guide copy, and evidence-node interaction.
- Create `src/app/components/CaseCapsuleScene.tsx`: lazy-loaded React Three Fiber canvas containing the capsule, path, light, and four named poses.
- Create `src/app/components/CaseCapsuleFallback.tsx`: static HTML/CSS frames for reduced motion, failed WebGL, and pre-load state.
- Create `src/app/components/CaseJourney.tsx`: request-to-action narrative.
- Create `src/app/components/Reveal.tsx`: client-only IntersectionObserver wrapper for non-journey sections.
- Create `src/app/components/landing.module.css`: shared landing component layout, depth, and motion.
- Modify `src/app/page.tsx`: outcome-first page composition and final copy.
- Modify `src/app/page.module.css`: page-level section layout only; remove old component styles.
- Modify `src/app/globals.css`: color, type, spacing, base focus, and reduced-motion tokens.
- Modify `src/app/layout.tsx`: load Manrope, Inter, and IBM Plex Mono through `next/font/google`.
- Modify `src/app/connect/page.module.css`: adopt the same token and depth system.
- Modify `package.json` and `package-lock.json`: add exact compatible versions of `three`, `@react-three/fiber`, and Three.js types after checking React 19 support.
- Test with `npm run lint`, `npm run build`, keyboard navigation, 360px/768px/1440px screenshots, reduced-motion mode, WebGL disabled, and throttled mobile performance.

---

### Task 1: Establish the visual system

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/connect/page.module.css`

**Interfaces:**
- Consumes: current Next.js root layout.
- Produces: CSS variables `--font-display`, `--font-body`, `--font-data`, palette tokens, elevation tokens, and spacing tokens used by every later task.

- [ ] **Step 1: Read the installed Next.js font guidance**

Run: `rg -n "next/font" node_modules/next/dist/docs | head -20`

Expected: local Next.js 16 documentation paths for font loading.

- [ ] **Step 2: Load the three planned font roles**

Use `Manrope`, `Inter`, and `IBM_Plex_Mono` from `next/font/google`, assign each a CSS variable, and apply the variables on `<body>`.

- [ ] **Step 3: Replace the current warm-gray token set**

Define the six palette colors exactly as listed above plus semantic surface, border, focus, and three-layer shadow tokens. Preserve a visible amber keyboard focus ring.

- [ ] **Step 4: Align the connect placeholder**

Update its card radius, typography, background, and status treatment without changing its honest “Not connected” content.

- [ ] **Step 5: Verify the foundation**

Run: `npm run lint && npm run build`

Expected: both commands exit 0; `/` and `/connect` remain static routes.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/app/connect/page.module.css
git commit -m "style: establish WISMO visual system"
```

### Task 2: Build the evidence-desk hero

**Files:**
- Create: `src/app/components/LandingNav.tsx`
- Create: `src/app/components/EvidenceDesk.tsx`
- Create: `src/app/components/landing.module.css`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css`

**Interfaces:**
- Consumes: global visual tokens from Task 1.
- Produces: `LandingNav(): JSX.Element` and `EvidenceDesk(): JSX.Element` server components.

- [ ] **Step 1: Replace the hero copy with the owner outcome**

Use the exact headline, subhead, CTA, and CTA note from “Copy hierarchy.” Keep `/connect` as the CTA target. Do not mention tracking, Shopify matching, or AI in the headline.

- [ ] **Step 2: Lead the evidence scene with the customer reply**

Place the approved reply from “Human reply standard” on the top plane. Create supporting cards for the customer email, Shopify order `#4921`, tracking number `TRK-123`, newest courier scan, and manager approval underneath it. Repeat `TRK-123` in the order and courier layers so the evidence line demonstrates why the answer can be trusted.

- [ ] **Step 3: Add depth with layout, not decoration**

Use perspective, overlapping planes, borders, a single radial light, and the documented three-layer shadows. Keep every text item readable at 200% zoom.

- [ ] **Step 4: Make typography the bold visual moment**

Apply the 700–800 display weight and `clamp(64px, 8.2vw, 112px)` hero scale. Let the headline span most of the content width before the product scene overlaps its lower-right edge. Keep the eyebrow, body, and CTA visually quiet; do not add a second oversized statement inside the hero.

- [ ] **Step 5: Add the one hero motion sequence**

Animate the layers once on page load with CSS keyframes and the documented timing. Animate the evidence line only after the order and courier layers are visible.

- [ ] **Step 6: Make the hero responsive**

At 980px stack copy above the evidence desk. At 680px remove perspective, reduce overlap, and display cards in a clear vertical sequence without horizontal overflow.

- [ ] **Step 7: Verify hero behavior**

Run: `npm run lint && npm run build`

Expected: zero warnings from app code and no horizontal overflow at 360px.

- [ ] **Step 8: Commit**

```bash
git add src/app/components/LandingNav.tsx src/app/components/EvidenceDesk.tsx src/app/components/landing.module.css src/app/page.tsx src/app/page.module.css
git commit -m "feat: build evidence desk hero"
```

### Task 3: Build the guided 3D case journey

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/app/components/AgentJourney.tsx`
- Create: `src/app/components/CaseCapsuleScene.tsx`
- Create: `src/app/components/CaseCapsuleFallback.tsx`
- Modify: `src/app/components/landing.module.css`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: visual tokens and evidence content from Tasks 1–2.
- Produces: `AgentJourney(): JSX.Element`, four named states (`request`, `order`, `tracking`, `approval`), and an accessible evidence-node interaction shared by 3D and fallback views.

- [ ] **Step 1: Confirm compatible 3D packages**

Check the installed React version against the official React Three Fiber compatibility guidance. Install pinned compatible versions of `three`, `@react-three/fiber`, and `@types/three`; do not add a physics or animation library.

- [ ] **Step 2: Build the static fallback first**

Create four semantic frames showing the capsule at request, order, tracking, and approval. Each frame contains the same guide sentence and evidence available in the enhanced scene. Render this version for reduced motion and until the canvas reports ready.

- [ ] **Step 3: Build the lightweight case capsule**

Construct the capsule from primitive rounded geometry, one baked-looking material, and two lights. Keep detailed text outside WebGL in HTML. Export four exact object poses and one camera pose per journey state.

- [ ] **Step 4: Connect scroll to named states**

Use one sticky stage and four viewport chapters. IntersectionObserver selects the active chapter; interpolate to the next named pose over 500–700ms. Do not bind raw scroll position directly to camera movement.

- [ ] **Step 5: Add the agent narration**

Show these lines in order: `Amina asked where her order is.` `I found the right order.` `I checked the newest matching update.` `Your reply is ready to review.` Announce state changes politely through one `aria-live="polite"` region, but do not announce decorative movement.

- [ ] **Step 6: Make evidence nodes interactive**

Give order and tracking nodes visible HTML buttons aligned over the scene. Hover, tap, or keyboard focus opens the source card; Escape closes it and returns focus. Never require dragging or precise pointer movement.

- [ ] **Step 7: Add defensive fallbacks**

Detect reduced motion before loading the 3D bundle. Catch canvas creation failure and retain the static fallback. Pause rendering when the stage leaves the viewport. Cap device pixel ratio at `1.5`.

- [ ] **Step 8: Verify the scene**

Test desktop pointer interaction, keyboard-only evidence inspection, touch scrolling, reduced motion, WebGL disabled, and a throttled mobile profile. The CTA must work before and during scene loading.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/app/components/AgentJourney.tsx src/app/components/CaseCapsuleScene.tsx src/app/components/CaseCapsuleFallback.tsx src/app/components/landing.module.css src/app/page.tsx
git commit -m "feat: add guided 3D case journey"
```

### Task 4: Turn the workflow into a product story

**Files:**
- Create: `src/app/components/CaseJourney.tsx`
- Create: `src/app/components/Reveal.tsx`
- Modify: `src/app/components/landing.module.css`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css`

**Interfaces:**
- Consumes: global tokens and evidence-card visual language.
- Produces: `CaseJourney(): JSX.Element` and `Reveal({ children, delay, className }): JSX.Element`.

- [ ] **Step 1: Create the reveal wrapper**

Use IntersectionObserver with threshold `0.18`. Add a visible class once, disconnect the observer, and render children normally before hydration so content never depends on JavaScript.

- [ ] **Step 2: Build four outcome-led workflow chapters**

Use `Ask once`, `Get checked`, `Stay in control`, and `Receive a clear answer`. Pair each customer-facing heading with its internal state—`Request`, `Verify`, `Decide`, or `Act`—in small supporting type. Each chapter pairs one short sentence with a focused product crop, not a numbered feature card.

- [ ] **Step 3: Show system connections**

Add a quiet integration rail reading `Gmail → WISMO → Shopify → Courier`, with `Manager approval` branching between decision and action. Use text and simple inline SVG marks; do not use unlicensed logos.

- [ ] **Step 4: Add the plain product definition**

Before the workflow chapters, render `WISMO investigates delivery questions and prepares the reply.` as the section's bold statement. Follow it with one short owner-facing sentence and the product scene. This is the Gorgias-inspired clarity point: category, work handled, and handoff are understood before deeper detail.

- [ ] **Step 5: Add scroll reveals**

Apply the documented opacity and 18px motion to chapter copy and product crops. Stagger paired elements by 80ms; do not animate every line of text.

- [ ] **Step 6: Implement reduced motion**

Inside `@media (prefers-reduced-motion: reduce)`, disable hero keyframes, reveal transforms, and smooth scrolling. All elements must render at full opacity.

- [ ] **Step 7: Verify interaction and accessibility**

Navigate the page using Tab and Shift+Tab. Confirm focus order follows reading order and all product scenes have an accessible label or are marked decorative.

- [ ] **Step 8: Commit**

```bash
git add src/app/components/CaseJourney.tsx src/app/components/Reveal.tsx src/app/components/landing.module.css src/app/page.tsx src/app/page.module.css
git commit -m "feat: add WISMO case journey"
```

### Task 5: Add trust, restraint, and the final conversion path

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css`
- Modify: `src/app/components/landing.module.css`

**Interfaces:**
- Consumes: the page composition from Tasks 2–4.
- Produces: final guardrails, proof strip, CTA, and footer.

- [ ] **Step 1: Replace unsupported proof numbers**

Remove `100%` and any performance framing that could read as customer evidence. Keep factual product commitments: exact tracking match, newest valid scan, and manager approval before action.

- [ ] **Step 2: Add the owner-and-customer outcome section**

Use `Less chasing for you. Better answers for them.` Contrast the owner's old workflow—open email, search Shopify, check tracking, remember follow-up—with the new outcome—review one prepared decision. Beside it, contrast the customer's old experience—waiting and repeating details—with a prompt, specific reply. Do not format this as a feature comparison table.

- [ ] **Step 3: Build the safety section around evidence**

Show the three guardrails as a connected decision record with timestamps and state labels. Use jade only for verified states and amber only for attention or pending approval.

- [ ] **Step 4: Add one quiet final CTA**

Use the exact final heading from “Copy hierarchy,” one `Connect support mailbox` link, and the honest integration note. Do not add a second competing action.

- [ ] **Step 5: Finish navigation and footer behavior**

Anchor `How it works` and `Safety` links to real section IDs. Keep the navbar static initially; a sticky blurred bar is unnecessary and would compete with the hero depth.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/app/page.module.css src/app/components/landing.module.css
git commit -m "feat: finish landing trust and conversion sections"
```

### Task 6: Visual QA and production release

**Files:**
- Modify only files with defects found during review.

**Interfaces:**
- Consumes: complete redesign.
- Produces: tested production landing page.

- [ ] **Step 1: Run automated checks**

Run: `npm run lint && npm run build`

Expected: both commands exit 0 and Next.js renders `/` plus `/connect` as static pages.

- [ ] **Step 2: Review at three widths**

Capture full-page screenshots at 360×800, 768×1024, and 1440×1000. Check type wrapping, overlap, CTA visibility, spacing rhythm, and horizontal overflow.

- [ ] **Step 3: Review motion modes**

Test once with normal motion, once with reduced motion, and once with WebGL disabled. Confirm the normal sequence explains causality and both fallback versions lose no information.

- [ ] **Step 4: Review performance**

Run a production Lighthouse test on mobile. Confirm the page content and CTA appear without waiting for 3D, the canvas is lazy-loaded, device pixel ratio is capped, offscreen rendering pauses, and the custom 3D asset payload remains under 250KB compressed.

- [ ] **Step 5: Review content accuracy**

Confirm the page never says WISMO sends messages or changes Shopify without manager approval. Confirm all sample data is clearly product demonstration content. Read every section using the “Now you can…” test: it must improve the owner's or customer's day. Remove any section that only names a capability.

- [ ] **Step 6: Remove one unnecessary flourish**

Review every glow, border, badge, and moving element. Remove the least useful decorative treatment before release.

- [ ] **Step 7: Commit and push**

```bash
git add src/app
git commit -m "fix: polish WISMO landing experience"
git push origin main
```

- [ ] **Step 8: Verify Vercel**

Open the production URL after the automatic deployment completes. Confirm HTTP 200, the new hero copy, working `/connect` navigation, and no browser console errors.

---

## Self-review

- Spec coverage: primary CTA, manager approval, tracking-number match, newest scan, Shopify/Gmail context, responsive behavior, accessibility, and honest claims are each covered.
- Deliberate risk: the guided 3D case capsule is specific to WISMO and carries the visual identity; detailed product UI and all other sections remain restrained.
- Generic patterns removed: no gradient headline, floating blobs, bento feature grid, infinite logo marquee, fake testimonials, or arbitrary `01/02/03` decoration.
- Type consistency: component names and CSS token roles are stable across tasks.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps remain.
