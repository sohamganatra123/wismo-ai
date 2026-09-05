# WISMO

## Delivery answers, with a safety boundary

WISMO handles the “where is my order?” inbox work that normally means searching email, checking order data, and deciding whether a reply is safe.

It reads a Gmail inbox, checks a controlled order snapshot, and prepares the next safe action. When the evidence is clear, WISMO can prepare a customer update. When identity, order matching, or tracking is unclear, it stops and asks for human attention.

**No guesswork. No hidden sends. Every decision has a trail.**

---

## The problem

Delivery questions look simple until the details disagree.

An agent may need to find the right customer, distinguish between several orders, compare tracking events, ask a follow-up question, or stop because a provider is unavailable. A fast answer is not useful if it exposes the wrong order or states an unverified delivery status.

WISMO turns that work into a bounded, reviewable flow.

## How it works

```text
Gmail message
      ↓
Classify the request
      ↓
Match one customer and one order
      ↓
Check the newest tracking evidence
      ↓
Prepare a safe action or stop for review
      ↓
Keep the conversation and decision trail together
```

### 1. Read the inbox

WISMO polls one connected Gmail inbox and stores each message once. Unrelated messages do not create delivery cases.

### 2. Match the evidence

The agent checks sender, order references, order status, tracking numbers, and courier replies against the active order snapshot. It does not silently choose between multiple possible orders.

### 3. Respect the boundary

Missing or conflicting evidence becomes a clarification, review, or escalation. External actions use stable action keys and approval checks so the same action cannot run twice.

### 4. Show the work

Each case exposes its activity, agent status, token usage, estimated model cost, approvals, and delivered messages. The customer-facing reply remains separate from internal activity data.

## What is live today

- Gmail polling for delivery-status conversations
- A validated `orders.csv` snapshot as the order source
- Exact customer and order matching
- Deterministic clarification for missing or ambiguous information
- Courier follow-up and customer-update workflows
- Human approval for risky external actions
- Case activity and agent-run observability
- Conversation-wide input tokens, output tokens, and estimated model cost
- A 100-case deterministic safety evaluation in CI

## Safety first

WISMO does not treat a plausible answer as a verified answer.

- One exact match is required before order facts are used.
- Conflicting tracking evidence stops the customer reply.
- Unrelated email creates no case and sends no reply.
- Provider failures escalate instead of producing invented information.
- Draft mode requires manager approval before an external action.
- Every outbound action is protected against duplicate execution.
- Model input and output are bounded and sensitive content is redacted from audit views.

The system is designed to assist a support operator. It is not a claim of perfect production accuracy.

## Live task cost

The agent records input and output tokens for every model response. Conversation cost adds all runs belonging to the same case.

The current pricing table is:

| Model | Input | Output |
| --- | ---: | ---: |
| `gpt-5-mini` | $0.25 / 1M tokens | $2 / 1M tokens |
| `gpt-5` | $1.25 / 1M tokens | $10 / 1M tokens |

The model is selected with `OPENAI_MODEL`. The estimate is calculated from recorded usage; it is not a billing statement.

## 100-case safety eval

The eval set contains 100 synthetic cases across ten categories:

- Matched orders
- Unknown customers
- Ambiguous orders
- Tracking conflicts
- Packages marked delivered but missing
- Unrelated emails
- Empty messages
- Unclear delivery questions
- Provider failures
- Approved retries

Each category has ten variants. The evaluator checks classification and whether an external action is allowed under the approval rules.

Run it locally:

```bash
npm run eval -- --reporter=verbose
```

Write a JSON report:

```bash
WISMO_EVAL_REPORT=artifacts/wismo-eval-report.json npm run eval
```

The report records totals, pass rate, category results, and bounded failure reasons. GitHub Actions runs the eval on every pull request and every push to `main`, then stores the JSON as a workflow artifact.

See [`docs/evals/wismo-100-case-eval.md`](docs/evals/wismo-100-case-eval.md) for the full description.

This is a regression and safety-policy eval, not a production accuracy measurement. A 100% result means the checked deterministic expectations match the current code; it does not mean the live agent is correct on every customer conversation.

## Order snapshot format

The import expects this header:

```csv
order_id,customer_email,customer_name,status,tracking_number,carrier,status_updated_at,line_items
```

Rows must contain a valid order ID, customer email, status, and ISO 8601 update timestamp. The importer rejects duplicate IDs, malformed email addresses, invalid timestamps, formula-prefixed cells, oversized files, and extra columns.

## Run the project

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm test
npm run eval
npm run lint
npx tsc --noEmit
npm run build
```

## Configuration

Create `.env.local` with the values required by your Convex and Gmail setup. The main application settings include:

```text
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CONVEX_SITE_URL=...
CONVEX_DEPLOYMENT=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

Keep credentials out of the repository. WISMO stores connected integration credentials encrypted on the server.

## Where to look in the app

- `/inbox` — review delivery conversations
- `/inbox/automation` — inspect active agent work and live task cost
- `/inbox/history` — view resolved conversations
- `/connect` — connect Gmail and configure the workspace

## Deployment

The app is built as a Next.js application with Convex as its backend and Vercel as the hosting target. Pushes to `main` run the safety eval, upload its JSON report, run lint and type checking, and build the production app through [`.github/workflows/wismo-eval.yml`](.github/workflows/wismo-eval.yml).

The workflow is a release gate. Production deployment still depends on the hosting provider being connected to the repository’s `main` branch.

## Project structure

```text
convex/                 Convex schema, queries, mutations, and agent runtime
convex/domain/          Bounded business and safety rules
src/app/inbox/          Inbox, automation, history, and observability UI
src/evals/              The 100-case safety eval and report writer
docs/evals/             Eval documentation
.github/workflows/      CI and deployment checks
```

## Current boundary

WISMO currently focuses on one Gmail inbox and one validated order snapshot. Shopify, Slack, Zoom, CRM integrations, automatic sending beyond the configured safety gates, and broad knowledge-management features are outside this version’s scope.
