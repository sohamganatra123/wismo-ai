# Continuous Support World Fix Implementation Plan

> **For agentic workers:** Implement these checked tasks in order; each task has its own verification gate.

**Goal:** Make scenes 01–04 read as one collision-free world where one WISMO agent travels through source systems and returns evidence in sequence.

**Architecture:** Keep the sticky stage and permanent zones. Derive investigation-local progress from the existing scroll progress, interpolate one agent between named viewport waypoints, and derive source highlights and evidence visibility from completed return legs.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules

**Spec:** `docs/design/support-web-storyboard.md`

## Global Constraints

- Preserve every existing scene.
- Verify widths 1440px, 768px, and 390px.
- Use one WISMO element; no static substitute routes.
- Evidence appears only after its matching source visit and desk return.

---

### Task 1: Give permanent zones collision-free bounds

**Files:**
- Modify: `src/app/support-web/supportWorld.module.css`

- [x] Replace overlapping desktop/tablet/mobile absolute bounds with dedicated guide, intake, desk/message, and source regions.
- [x] Add scene-specific recession where a narrow viewport cannot display every full-size zone at once.
- [x] Check scene 01–04 geometry at 1440px, 768px, and 390px.

### Task 2: Drive one WISMO agent through named waypoints

**Files:**
- Modify: `src/app/support-web/SupportWorld.tsx`
- Modify: `src/app/support-web/supportWorld.module.css`

- [x] Convert global scroll progress to investigation-local progress.
- [x] Interpolate `desk → Shopify → desk → History → desk → Courier → desk`.
- [x] Derive the active source from proximity to its visit waypoint.
- [x] Remove the static route-line markup and styles.

### Task 3: Gate evidence on completed returns

**Files:**
- Modify: `src/app/support-web/SupportWorld.tsx`
- Modify: `src/app/support-web/supportWorld.module.css`

- [x] Reveal each evidence item only after return legs 2, 4, and 6.
- [x] Animate evidence with transform and opacity.
- [x] Run lint/build and visually verify all required widths and scenes.
