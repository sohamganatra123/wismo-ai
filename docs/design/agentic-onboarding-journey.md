# Agentic WISMO Onboarding Journey

## Outcome

Turn `/connect` from a six-screen setup wizard into a five-stage agent briefing. A Shopify founder should feel that they are preparing a worker: setting its mission, giving it evidence, correcting what it learned, watching one investigation, and choosing how much control it receives.

This remains a guided local walkthrough. It must not claim that Gmail or Shopify connected, a customer message was sent, or live automation was activated.

## Human, task, and feel

- **Human:** A Shopify founder or support lead who wants WISMO to handle delivery questions but needs proof before trusting it.
- **Task:** Brief WISMO, supply the required sources, inspect its learned voice and evidence work, then save a control level.
- **Feel:** A calm dispatch desk where the agent reports its work and waits for judgment at the right moments.

## Product world

- **Domain:** agent brief, shipping manifest, evidence source, case file, courier scan, control boundary, work receipt.
- **Color world:** receipt paper `#F7F4EA`, deep paper `#ECE5D5`, carbon ink `#171714`, graphite `#5B594F`, kraft `#CDAE7D`, cobalt signal `#2457FF`, quiet rule `#D1C8B6`.
- **Signature:** One cobalt evidence line runs through the journey while a persistent WISMO status says what the agent is doing, what it needs, or when it is ready.
- **Rejecting:** generic stepper → evidence manifest; disconnected forms → one continuous agent brief; looping assistant animation → motion only while work is happening; success confetti → a compact work receipt.

## Journey

### 01 · Brief

Set the owner and show the fixed mission: resolve “Where is my order?” questions. Keep the local name, email, and password form. State that progress stays on the device and the password is never stored.

### 02 · Evidence

Gmail and Shopify appear as two ordered sources in one visible stage. They keep separate working, failure, retry, and verified states. Shopify stays locked until Gmail is verified. The screen explains why WISMO needs each source and says no external account or store data changes.

### 03 · Voice

WISMO presents the store voice it inferred. The reply specimen is the focal element; traits, greeting, and guidance remain editable. Store colors stay inside the specimen.

### 04 · Proof

Run one seeded case. Reveal customer question → Shopify identity → courier evidence → WISMO judgment in order. Each event includes text status and is announced through a live region.

### 05 · Control

Offer three native radio choices:

- `Investigate only` — WISMO gathers evidence and recommends a next step.
- `Draft for approval` — WISMO investigates and writes; a manager approves every outgoing message. Recommended default.
- `Resolve verified cases` — WISMO acts only when identity, order, and newest tracking agree; every conflict, correction, or exception goes to a manager.

Update an adjacent summary as the choice changes. Keep address changes, refunds, and delivery conflicts visibly outside scope. State `You can change this later in Agent settings.` Require a separate confirmation before saving.

## Agent status

Use state-derived language, never decorative assistant chatter:

- Waiting for your brief
- Waiting for inbox access
- Checking inbox access
- One source verified
- Learning from your store
- Learning your voice
- Ready to investigate
- Investigating the proof case
- Needs your decision
- Ready for work

The status may pulse only while WISMO is actively checking, learning, or investigating.

## Completion

Show a compact `BRIEFED AND READY` receipt with Inbox, Store, Voice, and Control. The main action opens `/inbox`. A secondary `Change control level` action returns to stage 05 without clearing the evidence or voice.

## Readability and interaction

- Archivo for headings, body, and controls; IBM Plex Mono for status and evidence labels.
- Titles: 56px desktop / 42px mobile, `-0.03em` tracking, `0.06em` word spacing.
- Body and inputs: 16px. Controls: 14px. Helper copy: 13px. Mono labels: 12px minimum.
- Controls are at least 44×44px and inputs are 56px high.
- Motion uses opacity and transform only: 100–160ms press feedback and 180–220ms stage/state feedback.
- Reduced motion shows final states immediately, keeps the evidence order visible, and removes all loops.
- Desktop rail is 296px above 1200px and 264px at tablet widths. Below 768px, use a sticky header with `Step N of 5`, current stage, agent status, and a 4px cobalt progress line.
