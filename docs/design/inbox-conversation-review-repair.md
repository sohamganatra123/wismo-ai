# Inbox Conversation Review Repair

## Goal

Make the live inbox tell the truth about what was sent, show the agent's handoff when a case needs human review, and let an authenticated founder write and send a manual reply without leaving the conversation.

## Current-code findings

1. The `order_needed` panel says **Clarification sent** from case status alone. That status is set before Gmail confirms a send. The only durable proof of a sent clarification is an outbound `messages` row whose `kind` is `agent_clarification` and whose `deliveryStatus` is `sent`.
2. `gmailData:listReceivedCases` loads the latest agent run but returns only its status. The agent run's `finalText`, `recommendation`, and `error`, plus the case's escalation reason and recommendation, never reach `LiveCases`. The human-review panel therefore falls back to generic copy.
3. The frontend treats `messages` and `canFounderReply` as optional during a backend rollout. When they are missing, `messagesForCase` silently creates a one-message thread and `canFounderReply` becomes false. The screen still calls that thread complete and gives no reason why the composer is absent.
4. The composer is gated by one silent boolean. A founder, a support agent, a resolved case, and a temporarily old backend can all get the same result: no reply control and no explanation.
5. The send action checks the founder role, but it does not reject a closed case or a case that already has a founder reply. The client also creates a new request ID after every failure. If Gmail accepted a request but the response was lost, a retry can become a second logical send.

The existing automated checks pass: 33 test files and 156 tests, TypeScript, and lint. They do not cover the state combinations above.

## Product model

The inbox must keep these records visually and semantically separate:

- **Conversation:** customer, WISMO, courier, and founder messages that were actually stored as sent or received.
- **Prepared draft:** customer-facing text waiting for approval. It is not a sent message.
- **Agent handoff:** why automation stopped and what the agent recommends. It is internal text, not a customer email.
- **Case state:** the next action required now.

No UI label may contain “sent” unless a stored outbound message has `deliveryStatus: "sent"` or Gmail success has been durably recorded.

## Review experience

The founder is a store owner handling an exception between other tasks. The focal point is the next safe action, with the full conversation immediately above it and supporting evidence below it. The screen should feel like the existing calm evidence desk: receipt paper, carbon ink, cobalt for WISMO, and muted red only for a true review block.

For a `human_attention` case, the detail column appears in this order:

1. Complete sent/received conversation.
2. Agent handoff with the real reason and recommendation; a prepared draft is labeled **Draft — not sent**.
3. Founder reply composer or a plain-language reason it is unavailable.
4. Order and courier evidence.
5. Technical Gmail IDs.

The product-specific signature remains the cobalt evidence line. It connects an outbound WISMO message, the handoff, and the founder action without turning every section into a generic card.

## Reply rules

- An authenticated founder may manually reply to an unresolved case, including every case in `human_attention`.
- A support agent can read the conversation and handoff but sees “Only the founder can send this reply.”
- A closed case or a case with a stored founder reply shows its sent receipt and cannot send again.
- The server returns a structured reply capability, and the send mutation applies the same rule again. The UI is guidance; the server is enforcement.
- The recipient email, original Gmail thread, and “send and resolve” effect are visible before submit.
- A draft survives switching between inbox rows during the current browser session.
- Success is proven by the new founder message appearing in the conversation. Failure keeps the text and the same request ID. If delivery is uncertain, WISMO searches Gmail for the stable RFC Message-ID before deciding whether the same request may resume.

## Delivery and rollout rules

- Deploy the Convex query and action contract before the frontend begins relying on it.
- During mixed frontend/backend versions, show “Full thread unavailable while inbox data updates” instead of calling a source-only fallback a complete thread.
- Do not disable safe reading of the source message during rollout.
- Do not enable send while reply capability is unknown.

## Acceptance checks

- A human-review case shows the stored escalation reason and recommendation instead of generic clarification copy.
- A sent agent clarification appears as an outbound message with its exact body.
- An `order_needed` case with no sent outbound clarification says **Clarification needed**, never **Clarification sent**.
- A prepared customer draft is visible and marked **not sent**.
- A founder sees a writable composer for an unresolved human-review case and can send through the original Gmail thread.
- A support agent sees why the composer is read-only.
- A closed or founder-replied case cannot send through either the UI or the server action.
- An uncertain Gmail result is reconciled by stable Message-ID: an existing Gmail message is recorded without resending; no match permits one guarded retry of the same logical request.
- Desktop and 375px-wide layouts keep the thread, handoff, composer, and send feedback readable without horizontal scrolling.
- Focus, disabled, sending, success, and error states are visible and keyboard usable.

## Out of scope

- Replacing Gmail polling.
- Changing which cases the agent escalates.
- Letting support-agent accounts send founder replies.
- Redesigning the separate sample case page at `/inbox/[caseId]`.

## Companion plan

Per-case observability is specified separately in `docs/design/inbox-observability.md`. It belongs beside the live conversation and handoff. The History navigation item remains reserved for a future archive of resolved conversations; it is not the observability surface.
