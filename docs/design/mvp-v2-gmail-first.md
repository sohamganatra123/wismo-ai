# MVP V2: Gmail-First WISMO

## Outcome

WISMO handles delivery-status email from one connected Gmail inbox and an uploaded `orders.csv` snapshot. Shopify is deferred; a later connector will implement the same order-source contract without changing the agent workflow.

## Core workflow

1. Gmail polling stores an inbound message once and classifies it.
2. A WISMO message starts an agent run immediately.
3. The agent extracts only explicit identifiers from the email: sender, order reference, tracking number, and courier name.
4. The order-source adapter matches the sender or explicit order reference against imported CSV rows.
5. Missing identifiers produce one deterministic clarification draft. No order facts are disclosed before identity is established by a configured source or human approval.
6. A configured courier may be contacted through Gmail with the minimum order and tracking identifiers. Replies are matched by Gmail thread, configured sender, and tracking number.
7. The agent prepares a deterministic customer update from stored evidence. Draft mode requires manager approval. Verified mode may send only after a successful Gmail proof and all safety checks pass.
8. Conflicts, unmatched replies, exhausted retries, failed sends, corrections, and unsupported requests escalate to a human.

## Evidence levels

- `unverified`: facts appear only in customer text; the agent may clarify or escalate, not state them as confirmed.
- `manager_confirmed`: a signed-in manager confirmed the order reference or tracking evidence; replies require approval.
- `courier_confirmed`: a reply matched an active courier contact, Gmail thread, and tracking number.
- `csv_confirmed`: a validated, freshly imported CSV row matched the sender and order.
- `connector_confirmed`: reserved for a later live Shopify connector using the same contract.

Only fresh `csv_confirmed`, `courier_confirmed`, and future `connector_confirmed` evidence may support verified automatic customer updates. Manager-confirmed evidence remains approval-only in V2.

## CSV contract

The required header is:

```csv
order_id,customer_email,customer_name,status,tracking_number,carrier,status_updated_at,line_items
```

- `order_id`, `customer_email`, `status`, and `status_updated_at` are required.
- `tracking_number`, `carrier`, and `line_items` may be empty.
- `status_updated_at` must be an ISO 8601 timestamp. Rows older than 24 hours are stale and cannot support automatic sending.
- Import rejects duplicate order IDs, malformed email addresses, invalid timestamps, extra columns, formula-prefixed cells, and files over 5 MB or 10,000 rows.
- A successful import replaces the active snapshot atomically: either every valid row becomes active together or the previous snapshot stays active.

## Product boundary

- Gmail and one valid `orders.csv` import are required for the simulated MVP.
- Shopify is not part of the MVP workflow or setup. It returns later as another implementation of `OrderSource`.
- Automatic actions are limited to one courier inquiry and one routine customer tracking update.
- One bounded clarification may send automatically when a delivery request is relevant but missing the order reference or question. Corrections, Shopify writes, refunds, address changes, delivery changes, financial actions, and other ambiguous cases require approval or escalation.
- The model chooses bounded tools. Application code owns permissions, evidence checks, stable action keys, and sending.
- Activation is stored server-side. Local storage may remember the open setup screen, never the active policy.

## Proof

The founder selects one fresh CSV order and runs a proof before verified mode can activate. WISMO reads that row and creates one unsent draft addressed to the connected founder inbox, with a stable Message-ID and `[WISMO PROOF - NOT SENT]` subject. Success requires a persisted CSV match, draft creation, and reconciliation; timers or local state cannot mark proof complete.

## Acceptance checks

- A workspace with Gmail and a valid CSV snapshot completes setup and receives cases.
- New WISMO mail schedules the agent and reads only the active CSV snapshot.
- Shopify code is not called by the MVP workflow.
- Exact sender plus one fresh order produces a deterministic status response.
- No match or multiple matches produces one clarification question without disclosing order facts.
- Unrelated mail creates no case and sends no reply.
- The same inbound message, model tool call, approval, courier request, or customer update cannot execute twice.
- Draft mode never sends without a signed-in manager.
- Verified mode remains locked until a real Gmail proof succeeds.
- Verified sending requires an exact recipient, exactly one fresh CSV order, matching tracking evidence when present, no conflict, and a stable unexecuted action key.
- Real courier messages and replies use Gmail; simulated controls are unavailable outside tests.
- Every model step, tool call, policy decision, external result, and error is visible in the case timeline.
- Tests, lint, type checking, Convex generation, production build, and a live sandbox smoke test pass.
