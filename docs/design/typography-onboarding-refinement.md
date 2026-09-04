# Wismo Typography and Onboarding Refinement

## Outcome

Refine the current Wismo landing page so words breathe, supporting copy can be read without effort, and the oversized WISMO logo remains the visual anchor without looking compressed. Redesign `/connect` as the product-side continuation of the Evidence Desk: an agent briefing and supervision journey that feels operational, safe, and unmistakably Wismo.

This is a visual and content-alignment pass. It does not change the onboarding reducer, simulation behavior, connection order, persistence rules, or safety boundaries.

## Feedback evidence

Reviewed references:

- `website-feedback/Screenshot 2026-09-01 at 9.06.52 AM.png`
- `website-feedback/Screenshot 2026-09-01 at 9.07.06 AM.png`
- `website-feedback/Screenshot 2026-09-01 at 9.07.25 AM.png`

Observed problems:

1. The final CTA headline visually collapses `Turn WISMO questions into finished work.` into a single mass because `letter-spacing: -0.07em` combines with a very tight line height.
2. The proof headline has the same problem: letterforms are individually legible, but spaces between words are not visually distinct.
3. The hero headline reads as `Whereismyorder?` at a glance because negative tracking is applied without compensating word spacing.
4. Hero body copy is acceptable on desktop but falls to roughly 12px on mobile.
5. Navigation, evidence labels, test-result labels, safety notes, and final footer copy are too small for comfortable scanning.
6. `/connect` is structurally usable, but its amber/jade wizard styling belongs to the earlier product system and does not feel connected to the cobalt Evidence Desk landing page.
7. `/connect` uses many 9–12px labels and helper lines, reducing clarity during a trust-sensitive setup flow.
8. The first onboarding eyebrow says `02 · Your account` even though the account screen is step one.
9. The landing says Google sign-in opens the connection flow, but `/connect` currently opens a local simulation with an email/password form. That handoff copy must be honest until the real connection flow replaces the simulation.

## Design research decision

The typography search suggested Space Grotesk for bold editorial SaaS work, but a font replacement does not address the actual defect shown in the screenshots. Archivo already provides the direct, industrial character Wismo needs. Keep Archivo and IBM Plex Mono so the system remains within two typefaces; repair tracking, word spacing, font size, line height, and text measure instead.

The onboarding design-system search returned a generic green/orange ecommerce block system. Reject it. It conflicts with the established Wismo palette, adds competing accents, and would make `/connect` look like a separate product.

## Visual thesis

An ecommerce evidence desk made legible: poster-scale editorial type on the landing page, then a quiet shipping-manifest workspace where every setup step feels checked, traceable, and safe.

## Human, task, and feel

- **Human:** A Shopify founder or support lead who has just accepted the landing-page promise and wants to see whether Wismo can be trusted with their inbox.
- **Task:** Understand the setup boundary, connect the required sources in order, verify the reply voice, prove one case, and deliberately activate WISMO-only automation.
- **Feel:** Calm like a well-organized dispatch desk; tactile enough to retain the brand, restrained enough to operate quickly.

## Domain exploration

- **Domain:** shipping manifest, case file, inbox source, storefront source, tracking scan, proof run, verification stamp, safety gate, dispatch receipt.
- **Color world:** receipt paper `#F7F4EA`, carbon ink `#171714`, graphite `#5B594F`, kraft `#CDAE7D`, cobalt signal `#2457FF`, quiet rule `#D1C8B6`. Error red is permitted only as a semantic error state.
- **Signature:** A continuous cobalt “verification line” travels through the onboarding rail. Completed sources become manifest rows marked `VERIFIED`; the current row is the only lifted interactive surface.
- **Rejecting:** generic rounded wizard cards → manifest rows; amber/green progress colors → one cobalt signal; fake service-logo tiles → explicit source labels; tiny utility copy → a deliberate readable scale.

## Typography system

Keep `Archivo` for display, body, and controls. Keep `IBM Plex Mono` for evidence IDs, progress, timestamps, and compact utility labels.

### Landing scale

| Role | Desktop | Mobile | Weight | Tracking | Word spacing | Line height |
|---|---:|---:|---:|---:|---:|---:|
| Brand display | `clamp(5.4rem, 11.2vw, 10.5rem)` | `clamp(3.7rem, 16.5vw, 4.9rem)` | 900 | `-0.065em` | normal | `0.78` |
| Hero headline | `clamp(2.25rem, 3.7vw, 4rem)` | `clamp(2rem, 8.8vw, 2.8rem)` | 760 | `-0.032em` | `0.08em` | `0.98` |
| Section headline | `clamp(3.25rem, 6.7vw, 7.2rem)` | `clamp(3rem, 14vw, 5rem)` | 850 | `-0.042em` | `0.08em` | `0.92` |
| Body | `clamp(1rem, 0.28vw + 0.94rem, 1.125rem)` | `0.96rem` minimum | 400–500 | normal | normal | `1.6` |
| Navigation/button | `0.875rem` | `0.8125rem` | 700 | normal | normal | `1.2` |
| Eyebrow/utility | `0.75rem` | `0.6875rem` minimum | 600 | `0.1em` | `0.04em` | `1.45` |
| Footnote | `0.75rem` | `0.6875rem` minimum | 500 | `0.035em` | `0.03em` | `1.55` |

Large headlines use `font-kerning: normal`, `text-wrap: balance`, and explicit positive word spacing. The oversized WISMO logo uses `-0.065em`; all other text stays at or above `-0.05em`. Body copy is never smaller than 15px; inputs are never smaller than 16px.

### Onboarding scale

Use a 1.25 product-interface ratio:

- Page title: 56px desktop / 42px mobile, 780 weight, `-0.03em` tracking, `0.06em` word spacing, `0.98` line height.
- Section title: 28px, 750 weight, `-0.02em` tracking, `1.1` line height.
- Body: 16px, 400–500 weight, `1.6` line height.
- Input text: 16px, 550 weight.
- Form label and button: 14px, 650–750 weight.
- Helper and rail secondary text: 13px, `1.45` line height.
- Mono eyebrow/status: 12px, 600 weight, `0.09em` tracking.
- No user-facing onboarding text below 12px.

## Landing content plan

The narrative and section order remain unchanged:

1. Hero — autonomous resolution promise.
2. Supporting evidence — seven sources Wismo checks.
3. Autonomous journey — receive, scan, courier, reply, resolve.
4. Proof — transparent 6 / 2 / 2 test result and safety gate.
5. Final CTA — connect or log in.

Only the handoff note changes: remove the current Google-sign-in claim beside `/connect` and use neutral setup language. Do not mention simulation on the landing page and do not claim an external connection has completed. `/login` may continue to mention Google because that route uses Google authentication.

Recommended connect note: `Setup takes about 5 minutes · progress stays on this device`.

## Onboarding layout plan

### Desktop

```text
┌───────────────────────┬──────────────────────────────────────────┐
│ WISMO.ai              │ 01 / YOUR ACCOUNT                        │
│ SETUP MANIFEST        │                                          │
│                       │ Make this setup yours.                    │
│ 01 ACCOUNT    CURRENT │ One clear sentence explaining the step.  │
│ 02 GMAIL      LOCKED  │                                          │
│ 03 SHOPIFY    LOCKED  │ [simulation rule / quiet manifest note]  │
│ 04 VOICE      LOCKED  │                                          │
│ 05 PROOF      LOCKED  │ Label                                    │
│ 06 LAUNCH     LOCKED  │ [inset input                              │
│                       │                                          │
│ ─ cobalt verify line │ [single primary action]                  │
└───────────────────────┴──────────────────────────────────────────┘
```

- Rail width: 296px at 1200px and above; 264px from 768–1199px.
- Main work surface: `min(100%, 780px)` with adaptive gutters of 32 / 64 / 96px.
- No generic centered card around the whole step.
- Use cards only where the surface is the interaction: Gmail permissions, Shopify connection, voice specimen, proof trace, and launch boundary.
- Depth strategy: warm surface-color shifts and quiet 1px rules. The current manifest row may lift by 2px; avoid large dashboard shadows.

### Mobile

- Replace the full rail with a 64px sticky manifest header.
- Show `Step 1 of 6` at 12px and the current step at 14px.
- Use a 4px cobalt progress line with a text alternative.
- Use 20px page gutters at 390px and 16px at 375px.
- Stack all fields and panels; never shrink text to keep a row horizontal.
- Keep the primary action in document flow, not fixed over content.

## Onboarding component direction

### Shell and rail

- Change the wordmark to `WISMO.ai` and remove the amber ring mark.
- Rename `Setup room` to `Setup manifest`.
- Current step: paper surface, cobalt index, `CURRENT` label.
- Completed step: plain row with cobalt `VERIFIED`; do not use a green check as the only state signal.
- Upcoming step: `LOCKED` text and muted ink; retain native disabled behavior.
- Simulation note becomes a ruled manifest footer, not a rounded gray card.

### Account

- Correct eyebrow to `01 · Your account`.
- Keep the native form and validation behavior.
- Use warm inset fields, 56px controls, 16px text, visible labels, and 13px helper/error copy.
- Present the simulation boundary as a horizontal ruled note with a cobalt `SIMULATION` label.

### Gmail and Shopify

- Replace fake `M` / `S` logo blocks with source headers: `SOURCE 01 / GMAIL` and `SOURCE 02 / SHOPIFY`.
- Keep the permission and URL surfaces because they are the interaction.
- Make working, success, and error states readable in text; color remains supplemental.
- Use one short cobalt scan motion during connection. Stop it offscreen and remove movement under reduced motion.

### Voice fingerprint

- Preserve this as the onboarding high point.
- Make the example reply the focal element; trait editors and swatches are secondary.
- Increase specimen reply text to 20px desktop / 18px mobile.
- Ensure editable traits wrap at 200% zoom and never force a three-column layout below 900px.
- Keep simulated store colors inside the specimen only; surrounding product chrome remains paper/ink/cobalt.

### Proof run

- Render Customer email → Shopify order → Courier status → Wismo reply as one continuous case trace, matching the landing journey vocabulary.
- Increase stage labels to 13px and values to 15px.
- Announce status through the existing live region and text, not motion alone.

### Launch and completion

- Turn the automation boundary into a single bordered manifest section with three selectable starting modes: `Investigate only`, `Draft for approval` (recommended), and `Resolve verified cases`.
- Update an adjacent plain-language summary immediately when the selection changes: what WISMO may do alone, what needs approval, and what always escalates.
- Keep the exact exclusions visible for every mode, and state `You can change this later in Agent settings.` directly below the selection.
- Keep the confirmation control and activation button separate.
- Completion is a dispatch receipt: connected inbox, store, voice, and scope in one readable definition list; no confetti or oversized success icon.

## Interaction thesis

Ship purposeful micro-interactions that explain agent activity or confirm input:

1. Landing entrance, CTA lift/press, navigation underline, evidence-tab lift, and the existing scroll journey remain.
2. A persistent agent-status element moves through `Waiting for you`, `Checking source`, `Learning`, `Investigating`, `Needs your decision`, and `Ready`.
3. Onboarding step transitions use 180–220ms opacity plus at most 8px vertical movement.
4. Source verification uses one cobalt scan line while Gmail, Shopify, or proof is working; it resolves into static `VERIFIED` text.
5. Voice traits appear as WISMO learns them, proof evidence arrives one event at a time, and the step-5 autonomy summary responds immediately to the selected mode.
6. Completion uses a short cobalt work-receipt stamp and transitions directly into the evidence desk. Nothing loops while the agent is idle.

Reduced motion renders final states immediately and keeps progress understandable without animation.

## Accessibility and quality constraints

- Normal body and helper copy must meet 4.5:1 contrast.
- All controls remain at least 44×44px; primary inputs/buttons are 52–56px high.
- Inputs keep visible labels and use 16px text to avoid mobile browser zoom.
- Focus uses a 3px cobalt ring with at least 3:1 state contrast.
- At 200% zoom, trait fields wrap and rail/main content remain operable.
- Test 375×812, 390×844, 768×1024, 1024×768, and 1440×900.
- Test every onboarding state, not only the account screen.
- Preserve keyboard order, native form semantics, disabled behavior, status announcements, persistence, and reduced motion.

## Acceptance checks

- Word spaces in all three feedback screenshots are visually obvious at a glance.
- No landing body copy is smaller than 15px and no landing utility copy is smaller than 11px.
- No onboarding body, label, helper, or status copy is smaller than 12px; form fields use 16px.
- `WISMO.ai` remains the strongest element in the hero.
- The final CTA still fits in one viewport at 1440×900 without compressing its notes below the minimum scale.
- `/connect` visibly belongs to the Evidence Desk system without replaying the landing hero.
- The six-step flow, state invalidation, local persistence, simulation boundary, and safety copy remain unchanged.
- The landing-to-connect handoff never claims Google sign-in or a real external connection when the simulation is active.
