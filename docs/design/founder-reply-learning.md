# Founder Reply And Learning

## Goal

Let the founder take over a delivery conversation from the inbox, reply in the original Gmail thread, and save that reply as a reviewed example for future agent responses.

## Product Rules

- Only an authenticated founder can send a manual reply.
- The reply is sent through the connected Gmail account in the original thread.
- A client request ID makes each send idempotent so retrying the same request cannot send twice.
- A successful founder reply resolves the current case.
- The full stored Gmail thread is shown oldest to newest, including customer messages, agent clarifications, automatic replies, and founder replies.
- A founder reply becomes an approved reply example only after Gmail confirms the send.
- “Learning” means recent approved founder examples are supplied to later agent runs. It does not mean model fine-tuning.
- Reply examples are redacted before they enter model context and never override evidence or safety rules.

## Review Experience

- The conversation is the primary surface.
- Each message states who sent it and whether it was a clarification, automatic reply, or founder reply.
- The founder composer sits after the thread and says that sending will resolve the case and save a reply example.
- Sending, success, validation, and failure states are visible without leaving the page.

## Limits

- Reply body: 1 to 4,000 trimmed characters.
- Learning context: the five newest successful founder examples.
- Customer message and founder reply are redacted and bounded before reaching the agent.
