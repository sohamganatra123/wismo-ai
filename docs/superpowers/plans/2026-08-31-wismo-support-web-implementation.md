# WISMO Support Web Implementation Plan

> **For agentic workers:** Implement this plan task-by-task and stop for visual approval after Tasks 2, 4, and 6. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one scroll-driven support world where WISMO collapses into a luminous bubble, works through connected system blocks, returns with evidence, and produces a readable customer answer.

**Architecture:** A fixed full-viewport stage reads progress from semantic scroll chapters. A local event source owns simulated support activity; React components render it without knowing how events are generated. CSS handles layout and simple transitions, while one focused animation controller handles the WISMO morph and route.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, native Web Animations API, existing Three.js packages only if CSS depth cannot deliver the approved static scene.

**Spec:** `docs/design/support-web-storyboard.md`

## Global Constraints

- No conventional navbar, stacked marketing sections, auto-playing sound, or unreadable decorative copy.
- Use `Manrope` for display, `Inter` for body/UI, and `IBM Plex Mono` only for short live data.
- Customer-facing claims remain outcome-led: less manual investigation, faster accurate answers, and human judgment when evidence conflicts.
- WISMO follows `humanoid → bubble → destination block → bubble + evidence → humanoid`.
- Active text stays sharp, reaches 4.5:1 contrast, and follows the minimum sizes in the spec.
- Reduced motion replaces travel and morphs with 250ms state crossfades.
- Mobile keeps live arrivals and case drill-down; it does not become a desktop page scaled smaller.
- No message is described as sent and no Shopify change is described as made without manager approval in v1.

## File map

- Create `src/app/support-web/types.ts`: event, case, system, evidence, and scene types.
- Create `src/app/support-web/mockEventSource.ts`: deterministic hero-case timeline plus replaceable background event generator.
- Create `src/app/support-web/useSupportSimulation.ts`: React subscription and bounded live state.
- Create `src/app/support-web/useScrollScene.ts`: maps semantic chapter positions to scene progress.
- Create `src/app/support-web/SupportWorld.tsx`: fixed stage and scene orchestration.
- Create `src/app/support-web/WismoMorph.tsx`: humanoid, bubble, scan, and system-block transition states.
- Create `src/app/support-web/SystemWeb.tsx`: Shopify, history, courier, and policy blocks.
- Create `src/app/support-web/CaseTrace.tsx`: accessible depth-on-demand dialog.
- Create `src/app/support-web/LiveHud.tsx`: live counter, scene progress, legend, and CTA.
- Create `src/app/support-web/supportWorld.module.css`: world layout, type scale, depth, responsive behavior, and reduced motion.
- Modify `src/app/page.tsx`: replace the current static page with `SupportWorld` and semantic chapters.
- Modify `src/app/globals.css`: load font variables and keep global accessibility defaults only.

---

### Task 1: Define the live support contract

**Files:**
- Create: `src/app/support-web/types.ts`
- Create: `src/app/support-web/mockEventSource.ts`

**Interfaces:**
- Produces: `SupportEvent`, `SupportCase`, `Evidence`, `EventSource`, and `createMockEventSource(seed: number): EventSource`.

- [ ] Define the seven event names from the storyboard and typed payloads for case ID, customer, timestamp, system, evidence, and outcome.
- [ ] Implement an event source with `subscribe(listener)`, `start()`, and `stop()`; rendering code must not import timers or random-number functions.
- [ ] Make hero case `WIS-2048` deterministic: Amina, order `#4921`, tracking `TRK-123`, final state `reply.prepared` at 42 simulated seconds.
- [ ] Bound background events to 14 desktop-visible records before rendering concerns are applied.
- [ ] Run `npm run lint` and confirm the new files add no errors.

### Task 2: Build the approved static spatial world

**Files:**
- Create: `src/app/support-web/SupportWorld.tsx`
- Create: `src/app/support-web/SystemWeb.tsx`
- Create: `src/app/support-web/LiveHud.tsx`
- Create: `src/app/support-web/supportWorld.module.css`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: types from Task 1.
- Produces: a static world with permanent intake, desk, system, resolution, human, and HUD zones.

- [ ] Load `Manrope`, `Inter`, and `IBM Plex Mono` with `next/font`; expose them as CSS variables.
- [ ] Lay out the six permanent zones in one fixed 100dvh stage. Keep the customer message at least 30vw wide on desktop.
- [ ] Apply the exact palette, protected text planes, and minimum type sizes from the storyboard.
- [ ] Write the hero as `Every request moves forward.` and support it with owner relief and customer response outcomes.
- [ ] Add semantic offscreen chapter content so the experience remains understandable without animation.
- [ ] Run `npm run build`, open at 1440px, 768px, and 390px, and capture screenshots.
- [ ] **Approval checkpoint:** review only composition, hierarchy, copy, and readability. Do not start motion until approved.

### Task 3: Connect the local live layer

**Files:**
- Create: `src/app/support-web/useSupportSimulation.ts`
- Modify: `src/app/support-web/SupportWorld.tsx`
- Modify: `src/app/support-web/LiveHud.tsx`

**Interfaces:**
- Consumes: `EventSource` from Task 1.
- Produces: `useSupportSimulation(source)` returning visible cases, handled count, resolution ratio, and hero-case state.

- [ ] Subscribe once on mount and cleanly stop the source on unmount.
- [ ] Update incoming files, resolution exits, and the HUD without moving active reading surfaces.
- [ ] Cap visible cases at 14 desktop, 7 tablet, and 4 mobile.
- [ ] Pause visual updates when the tab is hidden; resume without replaying a backlog.
- [ ] Run `npm run lint` and manually leave the page live for five minutes to check that item counts remain bounded.

### Task 4: Implement the WISMO bubble journey

**Files:**
- Create: `src/app/support-web/WismoMorph.tsx`
- Create: `src/app/support-web/useScrollScene.ts`
- Modify: `src/app/support-web/SupportWorld.tsx`
- Modify: `src/app/support-web/SystemWeb.tsx`
- Modify: `src/app/support-web/supportWorld.module.css`

**Interfaces:**
- Produces: `WismoMorph` with states `humanoid | collapsing | bubble | scanning | insideSystem | returning | expanding` and a named active destination.

- [ ] Map scroll chapters to the storyboard’s exact percentage ranges without tying animation state to raw pixel values.
- [ ] Build one sharp white-core bubble with an amber rim; keep its size between 72px and 96px on desktop.
- [ ] Animate the Scene 1 humanoid-to-bubble collapse in 520ms without particles or liquid wobble.
- [ ] Turn the bubble into the Scene 2 scan cursor, then gather it back into the same silhouette.
- [ ] Move it through Shopify, history, and courier using visible curved routes; do not teleport between blocks.
- [ ] At each destination, reshape the system surface to match its task and return one readable evidence block.
- [ ] Expand the bubble back into the humanoid only after the final evidence block reaches the desk.
- [ ] Add the reduced-motion crossfade path and verify it with the operating-system preference enabled.
- [ ] **Approval checkpoint:** record one desktop and one mobile scroll-through before building the answer and trace states.

### Task 5: Compose the answer and separate outcomes

**Files:**
- Modify: `src/app/support-web/SupportWorld.tsx`
- Modify: `src/app/support-web/supportWorld.module.css`

**Interfaces:**
- Consumes: hero-case evidence and WISMO final return state.
- Produces: readable answer composer, jade manager-review lane, and copper human-judgment lane.

- [ ] Lock returned evidence beside the open message in source order.
- [ ] Transform the message plane into the answer only after all three sources agree.
- [ ] Use the approved Amina reply and stop the visible timer at `00:42`.
- [ ] Route the hero case to `Ready for manager review`; route a separate conflicting case to human judgment.
- [ ] Keep paths, labels, and colors distinct without relying on color alone.
- [ ] Verify the page never claims that v1 sent the reply autonomously.

### Task 6: Add depth-on-demand and final invitation

**Files:**
- Create: `src/app/support-web/CaseTrace.tsx`
- Modify: `src/app/support-web/SupportWorld.tsx`
- Modify: `src/app/support-web/supportWorld.module.css`

**Interfaces:**
- Produces: `CaseTrace` dialog accepting a case, ordered trace steps, `open`, and `onClose`.

- [ ] Open the trace by clicking either resolved or human-review case; preserve the prior scroll position.
- [ ] Show understood issue, connected context, verification, decision, and prepared reply in 17px-or-larger body text.
- [ ] Use a native dialog or equivalent correct focus trap; close on Escape and restore focus to the case.
- [ ] Pause visual motion while keeping simulation state alive in memory.
- [ ] Place `Connect your support mailbox` on the cleared central desk at the end of the same world.
- [ ] Run keyboard-only, reduced-motion, 200% zoom, and mobile checks.
- [ ] **Approval checkpoint:** capture the live world, each system morph, both outcomes, and the open case trace.

### Task 7: Production checks and deployment

**Files:**
- Modify only files required by issues found during verification.

- [ ] Run `npm run lint` and `npm run build`; both must exit successfully.
- [ ] Confirm no essential content depends on WebGL, hover, custom cursor, or animation.
- [ ] Test 1440px, 768px, and 390px at 100% zoom and desktop at 200% zoom.
- [ ] Confirm the live layer works on mobile and the trace opens as a readable bottom sheet.
- [ ] Measure motion smoothness on a mid-range mobile profile; remove secondary effects before reducing text quality.
- [ ] Deploy to a Vercel preview and obtain visual approval before promoting it to production.
