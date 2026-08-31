# WISMO Support Web Storyboard

## North star

The website is one continuous, living support operation. The visitor does not move between conventional sections. The camera and interface move through one spatial world while WISMO handles a single customer request among many active requests.

The page must leave the visitor with three feelings:

1. **Relief:** routine delivery questions move forward without consuming the owner’s day.
2. **Confidence:** WISMO is fast because it checks the right evidence, not because it guesses.
3. **Connection:** the customer receives a specific, warm answer rather than robotic status text.

## Visual and product-language direction

The page combines two earlier references without copying either site:

- **Loop-inspired typography:** oversized, compact headlines with confident line breaks. The type creates the opening impact; gradients and decorative effects do not.
- **Gorgias-inspired product clarity:** the visitor always sees the customer question, the source being checked, the returned evidence, and the outcome. Product UI is the explanation.
- **WISMO signature:** the agent changes shape to match the work. Its humanoid form establishes character at the desk; its luminous bubble form carries intelligence through the system web; system blocks briefly adopt that same light when WISMO is working inside them.

This is not a dashboard and not a sequence of marketing sections. It is one cinematic workplace with a calm product interface layered into it.

### Design tokens

| Role | Choice | Use |
|---|---|---|
| Display type | `Manrope`, 750–800 | Loop-like bold headlines, tight tracking, short lines |
| Body and UI | `Inter`, 450–700 | Gorgias-like clarity in messages, evidence, controls, and trace views |
| Live data | `IBM Plex Mono`, 500–600 | Timers, order IDs, event states, never long prose |
| Ink | `#080B10` | Deep spatial background |
| Graphite | `#131A24` | System blocks and protected reading planes |
| Porcelain | `#F4F6F8` | Primary type and customer message planes |
| WISMO amber | `#FFB547` | Active intelligence, cursor, motion path |
| Verified jade | `#67D2AA` | Confirmed evidence and autonomous outcome |
| Human copper | `#C88752` | Judgment lane; deliberately distinct from WISMO amber |

Headlines remain plain porcelain. Amber is reserved for WISMO’s working state, so the brand signal does not become decoration.

### UI shape language

- Customer messages use wide, high-contrast paper planes with 20–28px text.
- Connected systems use substantial architectural blocks, not floating pills.
- Evidence returns as a block cut from its source system, so provenance remains visible.
- Corners use 12–18px radii. Only WISMO’s working form is fully circular.
- Borders are quiet. Depth comes from scale, occlusion, shadow, and light falloff rather than glass effects everywhere.
- Each scene has one dominant reading surface. Supporting cards stay visibly secondary.

## World map

The desktop world is wider than the viewport. The scroll journey moves the camera through it from left to right and then inward for the decision trace.

```text
                         BACK WALL — CONNECTED SYSTEMS

              ┌────────────────┐  ┌────────────────┐
              │ Customer       │  │ Shopify order │
              │ history        │  │ and fulfilment│
              └────────────────┘  └────────────────┘
                        ╲               ╱
                         ╲             ╱
  INTAKE                   WISMO DESK                RESOLUTION
  ┌──────────┐       ┌────────────────────┐      ┌──────────────┐
  │ Incoming │  ───▶ │ WISMO + open file │ ───▶ │ Answer ready │
  │ requests │       │ + intent bubble    │      │ Ready to send│
  └──────────┘       └────────────────────┘      └──────────────┘
                         ╱             ╲
                        ╱               ╲
              ┌────────────────┐  ┌────────────────┐
              │ Courier and    │  │ Linked cases   │
              │ tracking       │  │ and rules      │
              └────────────────┘  └────────────────┘

                  FOREGROUND — HUMAN JUDGMENT LANE
           ┌─────────────────────────────────────────┐
           │ Only uncertain cases cross into this   │
           │ lane. It never overlaps resolved work. │
           └─────────────────────────────────────────┘
```

### Permanent zones

| Zone | Desktop position | Purpose | May overlap |
|---|---|---|---|
| Intake | Far left, middle depth | Continuous stream of customer files | Background files may overlap each other, never copy |
| WISMO desk | Centre, foreground | Character, active file, intent bubble | Character may pass behind the bubble, never cover its text |
| System web | Upper and rear depth | Four large sources of truth | Light trails may cross empty space only |
| Resolution | Right, middle depth | Answer creation and delivered cases | Answer may replace the active file, never stack on it |
| Human judgment | Lower foreground | Uncertain-case handoff | Fully separate from autonomous-resolution lane |
| HUD | Screen-fixed outer edge | Brand, live state, CTA, scene progress | Nothing may render above it |

## Depth and layer map

```text
Z0  Environment plate and architectural light
Z1  Distant live request traffic
Z2  System stations and inactive cases
Z3  WISMO movement trail and system response pulses
Z4  WISMO character and active file
Z5  Large message, intent, evidence, and answer cards
Z6  Focused-case overlay
Z7  Fixed HUD and keyboard focus indicators
```

The character and interface cards use separate layout anchors. A card never inherits the character’s transform. At every camera stop, the active card occupies at least 30% of viewport width and has an explicit clear area around it.

## Storyboard

The full page is approximately 800vh on desktop. A fixed visual stage remains on screen while invisible semantic chapters provide scroll length and accessible content.

### Scene 0 — Already alive

**Scroll:** 0–10%

**Camera:** Wide view of the entire support operation. WISMO is visible at the central desk but does not dominate the scene.

**World action:**

- A new request enters every 2.8–4.5 seconds.
- Resolved cases leave through the jade resolution lane.
- One amber human-review signal remains visible.
- System stations show small, slow readiness pulses.

**Primary copy:**

> Every request moves forward.

**Supporting copy:**

> WISMO understands, investigates, and prepares accurate customer answers—while your team stays in control.

**HUD:** `37 handled today` · `84% end-to-end` · `42 sec median first action`

**Interaction:** The custom cursor attracts gently toward nearby files. Hovering a file reveals the customer name and current state in 16px text.

### Scene 1 — Catch and open

**Scroll:** 10–25%

**Camera:** Moves toward the intake lane, then follows one file to the central desk.

**World action:**

- Background operation slows to 35% speed but never stops.
- WISMO turns toward the selected file and catches it.
- The file opens horizontally above the desk.
- The raw customer message expands to a large speech card.
- Once the message is open, WISMO’s body folds inward from the shoulders and desk base into a concentrated 72px amber-white bubble. The face light remains visible as a small core, preserving character.

**Customer message:**

> Hi, do you know where my linen overshirt is?

**Guide copy:**

> Amina asked where order #4921 is.

**Timing:** File catch 420ms; file open 520ms; message reveal 380ms.

**Morph timing:** Body-to-bubble 520ms with a firm ease-in. No liquid wobble, cartoon squash, or particle explosion.

**Interaction:** Cursor movement changes the open file’s light by no more than four degrees. Clicking the message pauses the scene and shows the complete email.

### Scene 2 — Understand

**Scroll:** 25–36%

**Camera:** Holds on WISMO and the open file. The environment falls slightly out of focus.

**World action:**

- The WISMO bubble docks against the message plane and becomes a thin amber cursor that scans the message once from left to right.
- Key meaning lifts from the message into one large intent bubble.
- Customer name, request type, and probable order become distinct objects.
- The scan cursor gathers back into the same WISMO bubble. The intent bubble is a separate information object and never impersonates the agent.

**Intent bubble:**

> Delivery status · Order #4921 · High confidence

**Guide copy:**

> I know what Amina needs. Now I’m checking the right order.

**Trust signal:** Nothing leaves the desk until the customer and order match.

### Scene 3 — Super-speed investigation

**Scroll:** 36–62%

**Camera:** Pulls back and slightly upward to reveal the full system web.

**World action:**

1. The collapsed WISMO bubble leaves the desk on one continuous, destination-led path.
2. At Shopify, the bubble enters the order block. The block brightens from its centre and unfolds into an order-shaped workspace.
3. WISMO exits carrying a smaller rectangular evidence block: `#4921` plus `TRK-123`.
4. At customer history, WISMO stretches into a short conversation rail while the relevant earlier message opens. It returns to a bubble carrying one history block.
5. At courier tracking, WISMO becomes a moving scan line across the tracking block. It returns carrying the newest verified event.
6. Between destinations WISMO always returns to the same bubble silhouette, making the route easy to follow.
7. Each evidence block travels back on the path and locks into a vertical stack beside the still-open customer message.
8. After the final return, the bubble expands back into WISMO’s humanoid desk form.

**Important motion rule:** This is not teleportation or random streaking. The bubble remains visible throughout, every destination reshapes around the work being done, and every return carries one readable evidence block. Only the agent morphs; text never bends, blurs, or moves faster than it can be read.

**Transition grammar:** `humanoid → bubble → destination block → bubble + evidence → humanoid`. This is the page’s single signature animation and receives the highest motion budget.

**System cards:**

- `Shopify order · #4921 · exact customer match`
- `Customer history · 3 related messages`
- `Courier · TRK-123 · exact tracking match`
- `Newest scan · Failed attempt · 11:00`

**Guide copy changes with each stop:**

- `I found the right order.`
- `Amina doesn’t need to repeat herself.`
- `The courier number matches exactly.`
- `This is the newest valid update.`

**Live background:** Other files continue entering and leaving along outer lanes. Their labels remain hidden unless focused.

### Scene 4 — Return and compose

**Scroll:** 62–76%

**Camera:** Returns to the central desk from a slightly closer angle than Scene 1.

**World action:**

- Evidence objects arrive one at a time and align beside the open customer file.
- The final WISMO bubble lands at the desk and expands back into the recognisable humanoid form.
- The customer message transforms into a response composer.
- The verified facts enter the response as full phrases, not database fields.
- Timer stops at `00:42`.

**Customer answer:**

> Hi Amina — I checked order #4921. The courier tried to deliver it this morning and will try again tomorrow. You don’t need to do anything right now. I’ll keep an eye on it.

**Guide copy:**

> The answer is ready. Accurate, specific, and written for Amina.

### Scene 5 — Resolve or escalate

**Scroll:** 76–88%

**Camera:** Widens enough to show both outcome lanes without making the cards small.

**World action:**

- Amina’s case moves into a jade `Ready for manager review` lane.
- A separate mismatched-tracking case moves into the amber human-judgment lane.
- The two cases never share a path or color.

**Primary copy:**

> Fast when the evidence is clear. Human when judgment matters.

**Autonomous signal:** `3 sources agree · answer prepared`

**Human signal:** `Tracking conflict · no customer message sent`

**Interaction:** Clicking either case enters focused-case mode.

### Scene 6 — Depth on demand

**Scroll:** 88–96%, or activated by clicking a case

**Camera:** The surrounding world dims and moves backward. The chosen case expands into a readable inspection plane.

**Decision trace:**

1. `Understood` — delivery-status request for order #4921.
2. `Connected context` — customer, order, history, and tracking.
3. `Verified` — exact tracking match and newest event time.
4. `Decided` — another delivery attempt is scheduled; customer action is not required.
5. `Prepared` — warm reply ready for manager review.

**Interaction:**

- Escape or close returns to the exact prior scroll position.
- Keyboard focus remains trapped only while the trace is open.
- Background live events continue in data state but visual animation pauses.

### Scene 7 — Outcome and invitation

**Scroll:** 96–100%

**Camera:** Pulls back to show the operation running calmly without the visitor’s help.

**Primary copy:**

> Less detective work for your team. Faster answers for customers.

**CTA:** `Connect your support mailbox`

**Safety line:** `Customer messages and Shopify changes require manager approval in v1.`

The CTA lives inside the world on the now-clear central desk. There is no separate footer section.

## HUD and unconventional navigation

There is no header bar. The HUD floats at the viewport edges and uses the environment behind it.

```text
TOP LEFT                 TOP CENTRE                 TOP RIGHT
WISMO                    ● LIVE · 37 TODAY          CONNECT MAILBOX ↗

LEFT EDGE                RIGHT EDGE                BOTTOM CENTRE
Scene name               AI / HUMAN legend         01 ━━ 02 ━━ 03
```

- HUD text minimum: 14px desktop, 16px mobile.
- The scene-progress rail is clickable and keyboard accessible.
- Progress names appear on focus: `Live`, `Open`, `Investigate`, `Answer`, `Decide`.
- The HUD becomes simpler during focused-case mode.

## Cursor system

The cursor is an amber point with a soft 20px outer glow. It communicates intelligence but never replaces the browser focus indicator.

| Context | Cursor response |
|---|---|
| Empty world | 8px point, follows pointer directly |
| Near a file | Outer glow stretches toward the file |
| Over a file | Point expands to 16px; label reads `Inspect` |
| Over a system | Thin orbit appears; station brightens |
| Over CTA | Point becomes an arrow; native pointer remains supported |
| Keyboard use | Custom cursor hides; visible focus rings take over |

The cursor and WISMO bubble are related but never identical: the cursor is an 8–16px point; the agent bubble is 72–96px and contains the recognisable white core.

## Live event model

The visual layer receives events but does not create them.

```text
ticket.received
ticket.understood
context.requested
context.returned
case.resolved
case.escalated
reply.prepared
```

Default cadence:

- New ticket: random interval from 2.8–4.5 seconds.
- Understand: 600–1100ms after receipt.
- Resolve: 2.2–5.5 seconds after understanding.
- Escalate: one in every six cases in the simulation.
- Maximum visible background cases: 14 desktop, 7 tablet, 4 mobile.

The hero case uses deterministic timing so the scroll story is always understandable. Background cases use the event generator.

## Mobile storyboard

Mobile keeps the same world but uses a fixed portrait camera.

1. Intake files enter from the top.
2. WISMO occupies the lower third.
3. The active file opens in the upper half at full width.
4. System web becomes a vertical elevator: Shopify, history, courier, decision.
5. WISMO’s working presence moves upward through the stations and back down.
6. Outcome lanes appear as two full-width trays.
7. Focused-case mode becomes a bottom sheet with 18px body text.

No horizontal drag, free camera, or pinch gesture is required.

## Readability rules

- Hero headline: 88–120px desktop; 54–72px mobile.
- Scene headline: 56–76px desktop; 42–54px mobile.
- Active message and answer: 20–28px desktop; 18–22px mobile.
- System-card title: 16px minimum.
- System-card evidence: 16px minimum on every screen.
- Decision-trace body: 17px minimum desktop; 18px mobile.
- HUD: 14px minimum desktop; 16px mobile.
- Essential data labels: 16px minimum. Non-essential live-status labels: 14px minimum.
- Active reading width: 38–62 characters per line; no wide paragraphs floating across the scene.
- Text never sits directly on detailed imagery. Every reading surface has a solid or strongly blurred backing plane.
- At 1440px, 768px, and 390px viewport widths, all active copy must remain readable at 100% browser zoom.
- No essential content may be baked into generated imagery.
- Active text planes must maintain at least 4.5:1 contrast.

## Motion restraint

- Only one hero case performs the complete super-speed sequence.
- Background activity is slower, smaller, and lower contrast.
- No continuous character bobbing, camera drift, random particles, or decorative orbiting.
- Glows communicate state: white active, amber working or human attention, jade verified or resolved.
- Motion blur applies to the outer rim of the WISMO bubble only; its core and all UI text remain sharp.
- At most one system block reshapes at a time. Background cases use simple paths and never copy the hero morph.
- Reduced motion uses 250ms crossfades between the same readable states.

## Checkpoint approval criteria

The storyboard is ready for implementation only if all answers are yes:

- Does the page feel like one world rather than stacked sections?
- Can the visitor follow one file from arrival to answer?
- Is every super-speed movement connected to a clear destination and returned evidence?
- Are autonomous and human-review outcomes unmistakably different?
- Can every important message be read without zooming?
- Does the character remain recognisable without covering product information?
- Does the final CTA occur inside the world rather than in a conventional footer?
