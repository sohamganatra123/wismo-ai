# Inbox Conversation Review Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the real conversation and agent handoff for reviewed cases, then give an authenticated founder a reliable in-thread reply path.

**Architecture:** Make the backend return separate `conversation`, `agentHandoff`, and `replyCapability` fields instead of asking the client to infer them from one status. Derive user-facing labels from durable message delivery records, apply one shared manual-reply rule in the query and mutation, and keep unsent agent text outside the email timeline.

**Tech Stack:** Next.js 16, React 19, TypeScript, Convex, Gmail API, Vitest, CSS Modules

**Spec:** `docs/design/inbox-conversation-review-repair.md`

## Global Constraints

- “Sent” requires a stored outbound message with `deliveryStatus: "sent"` or a durably completed Gmail action.
- Agent handoff text and prepared drafts must never be rendered as delivered email.
- Only an authenticated founder may send a manual founder reply.
- The server must reject replies to closed cases and cases with an existing founder reply.
- Existing Gmail polling, automatic replies, approval actions, and founder-reply learning must keep working.
- Backend contract changes deploy before frontend code relies on them.
- `e2e-test-orders.csv` remains an untracked local test file.

---

### Task 1: Define one manual-reply access rule

**Files:**
- Create: `convex/domain/manualReplyAccess.ts`
- Create: `convex/domain/manualReplyAccess.test.ts`

**Interfaces:**
- Consumes: `role`, case `status`, and `hasFounderReply`.
- Produces: `manualReplyCapability(input): ManualReplyCapability` with one of `allowed`, `not_founder`, `case_closed`, or `already_replied`.

- [ ] **Step 1: Write the failing access tests.**

```ts
import { describe, expect, it } from "vitest";
import { manualReplyCapability } from "./manualReplyAccess";

describe("manualReplyCapability", () => {
  it("allows a founder to reply to a human-review case", () => {
    expect(manualReplyCapability({
      role: "founder",
      status: "human_attention",
      hasFounderReply: false,
    })).toEqual({ allowed: true });
  });

  it.each([
    ["support_agent", "human_attention", false, "not_founder"],
    ["founder", "closed", false, "case_closed"],
    ["founder", "human_attention", true, "already_replied"],
  ] as const)("blocks %s / %s / %s", (role, status, hasFounderReply, reason) => {
    expect(manualReplyCapability({ role, status, hasFounderReply })).toEqual({
      allowed: false,
      reason,
    });
  });
});
```

- [ ] **Step 2: Run `npx vitest run convex/domain/manualReplyAccess.test.ts`.** Expect failure because the module does not exist.
- [ ] **Step 3: Implement the shared rule and exported types.**

```ts
export type ManualReplyCapability =
  | { allowed: true }
  | {
      allowed: false;
      reason: "not_founder" | "case_closed" | "already_replied";
    };

export function manualReplyCapability(input: {
  role: "founder" | "support_agent";
  status: string;
  hasFounderReply: boolean;
}): ManualReplyCapability {
  if (input.role !== "founder") return { allowed: false, reason: "not_founder" };
  if (input.hasFounderReply) return { allowed: false, reason: "already_replied" };
  if (input.status === "closed") return { allowed: false, reason: "case_closed" };
  return { allowed: true };
}
```

- [ ] **Step 4: Run the focused test.** Expect all four access cases to pass.
- [ ] **Step 5: Commit.**

```bash
git add convex/domain/manualReplyAccess.ts convex/domain/manualReplyAccess.test.ts
git commit -m "test: define manual inbox reply access"
```

### Task 2: Return a truthful inbox contract

**Files:**
- Modify: `convex/gmailData.ts:299`
- Create: `convex/domain/inboxConversation.ts`
- Create: `convex/domain/inboxConversation.test.ts`

**Interfaces:**
- Consumes: stored Gmail messages, the latest agent run, case escalation fields, pending customer-email approval, and `manualReplyCapability` from Task 1.
- Produces: each inbox row with required `conversation`, optional `agentHandoff`, and required `replyCapability`.

- [ ] **Step 1: Write failing tests for the pure handoff projection.**

```ts
import { describe, expect, it } from "vitest";
import { buildAgentHandoff } from "./inboxConversation";

describe("buildAgentHandoff", () => {
  it("keeps escalation text separate from a customer-facing draft", () => {
    expect(buildAgentHandoff({
      status: "human_attention",
      escalationReason: "Tracking sources conflict",
      caseRecommendation: "Check the newest courier scan",
      runFinalText: "Compare the two recorded scans before answering.",
      runRecommendation: "Check the newest courier scan",
      recordedAt: 1_725_466_400_000,
      pendingDraft: "Hi Amina, I am checking the latest scan now.",
    })).toEqual({
      reason: "Tracking sources conflict",
      recommendation: "Check the newest courier scan",
      agentNote: "Compare the two recorded scans before answering.",
      draft: "Hi Amina, I am checking the latest scan now.",
      recordedAt: 1_725_466_400_000,
    });
  });

  it("returns null outside human review when there is no draft", () => {
    expect(buildAgentHandoff({
      status: "investigating",
      escalationReason: null,
      caseRecommendation: null,
      runFinalText: null,
      runRecommendation: null,
      recordedAt: null,
      pendingDraft: null,
    })).toBeNull();
  });
});
```

- [ ] **Step 2: Run `npx vitest run convex/domain/inboxConversation.test.ts`.** Expect failure because the projection does not exist.
- [ ] **Step 3: Implement `buildAgentHandoff`.** Trim empty values to `null`, prefer the case escalation reason and recommendation, retain a distinct agent note only when it differs from the recommendation, and label no field as sent.
- [ ] **Step 4: Replace the flat response fields in `listReceivedCases`.** Return this exact shape for the new fields:

```ts
conversation: {
  completeness: "complete" as const,
  messages: threadMessages
    .sort((left, right) => left.sentAt - right.sentAt)
    .map(toInboxMessage),
},
agentHandoff: buildAgentHandoff({
  status: item.status,
  escalationReason: item.escalationReason ?? latestAgentRun?.error ?? null,
  caseRecommendation: item.recommendation ?? null,
  runFinalText: latestAgentRun?.finalText ?? null,
  runRecommendation: latestAgentRun?.recommendation ?? null,
  recordedAt: item.escalatedAt ?? latestAgentRun?.completedAt ?? null,
  pendingDraft:
    customerUpdateApproval?.status === "pending" &&
    typeof customerUpdatePayload?.text === "string"
      ? customerUpdatePayload.text
      : null,
}),
replyCapability: manualReplyCapability({
  role: profile.role,
  status: item.status,
  hasFounderReply: threadMessages.some(
    (entry) => entry.kind === "founder_reply" && entry.deliveryStatus === "sent",
  ),
}),
```

Extract `toInboxMessage` in the same domain module so legacy `kind` inference stays in one tested place. Keep the source message's real sender, subject, body, and timestamp in `conversation.messages`.

- [ ] **Step 5: Add projection tests for legacy message kinds.** Verify an explicit kind wins, inbound defaults to `customer`, a legacy clarification body maps to `agent_clarification`, and another legacy outbound body maps to `agent_reply`.
- [ ] **Step 6: Run both focused domain tests.**

Run: `npx vitest run convex/domain/manualReplyAccess.test.ts convex/domain/inboxConversation.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
git add convex/gmailData.ts convex/domain/inboxConversation.ts convex/domain/inboxConversation.test.ts
git commit -m "feat: return inbox conversation and handoff state"
```

### Task 3: Derive labels from delivery evidence

**Files:**
- Modify: `src/app/inbox/liveCaseCompatibility.ts:1`
- Modify: `src/app/inbox/liveCaseCompatibility.test.ts:1`
- Create: `src/app/inbox/conversationPresentation.ts`
- Create: `src/app/inbox/conversationPresentation.test.ts`

**Interfaces:**
- Consumes: the new backend `conversation`, case status, and message delivery states.
- Produces: `conversationForCase(item)` with explicit completeness and `presentCaseState(input)` with truthful label, title, detail, and tone.

- [ ] **Step 1: Change the compatibility test to expose degraded data instead of hiding it.**

```ts
expect(conversationForCase(legacyCase)).toEqual({
  completeness: "source_only",
  messages: [expect.objectContaining({
    id: "source-case-1",
    kind: "customer",
    text: legacyCase.text,
  })],
});
```

Keep the existing new-backend case and expect it to return `completeness: "complete"` with the same message array.

- [ ] **Step 2: Write failing presentation tests for the reported regression.**

```ts
import type { InboxMessage } from "./liveCaseCompatibility";

function clarification(
  values: Pick<InboxMessage, "deliveryStatus">,
): InboxMessage {
  return {
    id: "message-clarification",
    direction: "outbound",
    party: "support",
    kind: "agent_clarification",
    from: "support@example.com",
    to: ["amina@example.com"],
    subject: "Re: Where is my order?",
    text: "Which order should I check?",
    sentAt: 1_725_466_401_000,
    deliveryStatus: values.deliveryStatus,
  };
}

it("does not claim a clarification was sent without a sent message", () => {
  expect(presentCaseState({ status: "order_needed", messages: [] }).label)
    .toBe("Clarification needed");
});

it("uses sent only when the clarification delivery record proves it", () => {
  expect(presentCaseState({
    status: "order_needed",
    messages: [clarification({ deliveryStatus: "sent" })],
  }).label).toBe("Clarification sent");
});

it("makes human review the next action even when an older clarification exists", () => {
  expect(presentCaseState({
    status: "human_attention",
    messages: [clarification({ deliveryStatus: "sent" })],
  }).label).toBe("Founder reply needed");
});
```

- [ ] **Step 3: Run the two frontend domain tests.**

Run: `npx vitest run src/app/inbox/liveCaseCompatibility.test.ts src/app/inbox/conversationPresentation.test.ts`

Expected: FAIL on the changed contract and missing presentation helper.

- [ ] **Step 4: Implement the compatibility and presentation helpers.** Human review takes precedence over historical clarification state. `Clarification sent` requires both `kind === "agent_clarification"` and `deliveryStatus === "sent"`. Closed-state copy similarly checks for a delivered founder or WISMO message instead of assuming one from `status`.
- [ ] **Step 5: Run the focused tests again.** Expect PASS.
- [ ] **Step 6: Commit.**

```bash
git add src/app/inbox/liveCaseCompatibility.ts src/app/inbox/liveCaseCompatibility.test.ts src/app/inbox/conversationPresentation.ts src/app/inbox/conversationPresentation.test.ts
git commit -m "fix: derive inbox labels from delivered messages"
```

### Task 4: Put the real handoff and reply action in the conversation

**Files:**
- Create: `src/app/inbox/AgentHandoff.tsx`
- Modify: `src/app/inbox/LiveCases.tsx:9`
- Modify: `src/app/inbox/FounderReplyComposer.tsx:21`
- Modify: `src/app/inbox/page.module.css:326`

**Interfaces:**
- Consumes: `conversationForCase`, `presentCaseState`, `agentHandoff`, and `replyCapability`.
- Produces: a conversation-first review surface with visible action or visible reason it is unavailable.

- [ ] **Step 1: Replace the local response type.** Add these exact fields and remove `canFounderReply` plus the flat optional `messages` field:

```ts
conversation?: {
  completeness: "complete";
  messages: InboxMessage[];
};
agentHandoff: {
  reason: string | null;
  recommendation: string | null;
  agentNote: string | null;
  draft: string | null;
  recordedAt: number | null;
} | null;
replyCapability?:
  | { allowed: true }
  | { allowed: false; reason: "not_founder" | "case_closed" | "already_replied" };
```

The optional wrappers are temporary rollout protection; Task 6 removes them after live verification.

- [ ] **Step 2: Render the conversation completeness state.** Keep the source-message fallback readable, but change the `aria-label` from “Complete Gmail thread” to “Gmail conversation” and add this message above a source-only fallback:

```tsx
{conversation.completeness === "source_only" ? (
  <p className={styles.threadSyncNotice} role="status">
    Full thread unavailable while inbox data updates. Sending is paused.
  </p>
) : null}
```

- [ ] **Step 3: Render the real handoff after the message thread.** `AgentHandoff` uses the heading **WISMO needs your review**, shows **Why it stopped**, **Recommended next step**, and optional **Agent note**. If `draft` exists, show it under **Draft — not sent** with preserved line breaks. Omit empty rows rather than replacing them with invented generic reasons.
- [ ] **Step 4: Replace `CaseState`'s status switch with `presentCaseState`.** The status strip states the current next action. The already-delivered clarification remains visible as a normal outbound message with its exact body.
- [ ] **Step 5: Make composer availability explicit.** Render `FounderReplyComposer` only when the conversation is complete and `replyCapability.allowed` is true. Otherwise render exactly one relevant explanation:

```ts
const blockedReplyCopy = {
  not_founder: "Only the founder can send this reply.",
  case_closed: "This conversation is resolved and cannot be sent again.",
  already_replied: "The founder reply is already in the conversation.",
};
```

Unknown capability during a mixed deployment uses “Reply controls are updating. Refresh shortly.”

- [ ] **Step 6: Improve the composer context and draft handling.** Pass both recipient name and recipient email. Show `To {email} · Original Gmail thread`. Store the unsent body in `sessionStorage` under `wismo:founder-reply:{caseId}` on change, restore it on mount, and remove it only after a confirmed `sent` or `already_sent` result. This prevents row switching from erasing work.
- [ ] **Step 7: Keep the same request ID on failure.** Remove `setSendRequestId(requestId())` from the catch branch. Keep the typed body, focus the error feedback, and let the server decide whether the same logical send can safely resume.
- [ ] **Step 8: Apply the existing evidence-desk system.** The handoff uses the muted-red left rule only for the stop reason; the unsent draft uses deep paper and a dashed quiet rule; the composer remains the single strongest action. Add focus-visible, disabled, sending, success, and error styles, keep 44px controls, and preserve the existing 8px spacing grid.
- [ ] **Step 9: Add responsive rules.** At 375px, remove outbound indentation beyond 20px, stack handoff rows, keep email addresses wrapping with `overflow-wrap: anywhere`, and make the send button full width.
- [ ] **Step 10: Commit.**

```bash
git add src/app/inbox/AgentHandoff.tsx src/app/inbox/LiveCases.tsx src/app/inbox/FounderReplyComposer.tsx src/app/inbox/page.module.css
git commit -m "fix: surface agent handoff and founder reply action"
```

### Task 5: Enforce reply state and retry safety on the server

**Files:**
- Modify: `convex/founderReplies.ts:57`
- Modify: `convex/domain/founderReply.ts:1`
- Modify: `convex/domain/founderReply.test.ts:1`
- Modify: `convex/schema.ts:103`

**Interfaces:**
- Consumes: the same `manualReplyCapability` from Task 1 and the existing client `requestId`.
- Produces: a reply action that blocks resolved duplicates and reconciles an unknown Gmail result before permitting a retry.

- [ ] **Step 1: Add a stable RFC Message-ID to the founder reply payload tests.** Expect `FounderReplyPayload` to include `messageId: "<founder-reply-{caseId}-{requestId}@wismo.local>"` after replacing characters outside `[A-Za-z0-9_-]`, and expect `founderReplyHeaders` to include `Message-ID: ...`.
- [ ] **Step 2: Run `npx vitest run convex/domain/founderReply.test.ts`.** Expect failure because the payload has no stable message ID.
- [ ] **Step 3: Implement and validate the stable Message-ID.** Keep it under 998 characters, include no whitespace or line breaks, and retain the existing `In-Reply-To` and `References` headers.
- [ ] **Step 4: Extend approval delivery state without adding a second email record.** Add this optional field to `approvals`:

```ts
deliveryState: v.optional(v.union(
  v.literal("not_started"),
  v.literal("sending"),
  v.literal("sent"),
  v.literal("unknown"),
)),
```

New founder reply claims start as `not_started`, change to `sending` immediately before the Gmail request, and become `sent` only in `finish`. A network exception after the request starts becomes `unknown`; validation, credential, and token failures before the request remain `not_started` and are retryable with the same request ID.

- [ ] **Step 5: Enforce the shared capability inside `claim`.** Load the thread before inserting an approval, calculate `hasFounderReply` from delivered `founder_reply` messages, call `manualReplyCapability`, and throw the mapped plain-language error for every blocked result. This prevents a direct action call from bypassing the UI.
- [ ] **Step 6: Handle an existing action key by delivery state.** Return `already_sent` for a completed/sent approval and reopen the same approval when `deliveryState === "not_started"`. Return `reconcile` for `sending` or `unknown`; do not send from that branch yet.
- [ ] **Step 7: Reconcile uncertain delivery through Gmail.** For a `reconcile` claim, call `GET /gmail/v1/users/me/messages` with `q=rfc822msgid:<stable-id>` and `maxResults=2`. The connected `gmail.modify` scope supports this query. If one matching Gmail message exists, pass its `id` to `finish` and return `already_sent`. If no match exists, call a serialized `resumeAfterReconciliation` mutation that changes only the same approval from `unknown` to `sending`; only the caller that receives `resumed` may issue the Gmail send. More than one match or a failed search returns `delivery_unknown` without sending. Reference: [Gmail `users.messages.list`](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list).
- [ ] **Step 8: Extend the action result and composer feedback.** Add `delivery_unknown` to the return union. Show “Gmail delivery could not be confirmed yet. Your reply is saved; refresh before trying again.” and leave the same request ID in place.
- [ ] **Step 9: Add domain tests for the new payload and state decisions.** Cover stable header generation, safe pre-send retry, completed-send deduplication, unknown delivery requiring reconciliation, one Gmail match becoming `already_sent`, zero matches permitting one guarded resume, and multiple matches remaining blocked. Put the pure approval-state decision in `convex/domain/founderReply.ts` so it can be tested without calling Gmail.
- [ ] **Step 10: Run focused tests.**

Run: `npx vitest run convex/domain/founderReply.test.ts convex/domain/manualReplyAccess.test.ts`

Expected: PASS.

- [ ] **Step 11: Commit.**

```bash
git add convex/founderReplies.ts convex/domain/founderReply.ts convex/domain/founderReply.test.ts convex/schema.ts src/app/inbox/FounderReplyComposer.tsx
git commit -m "fix: guard and reconcile founder reply sends"
```

### Task 6: Verify the full review path and finish the rollout

**Files:**
- Modify: `src/app/inbox/LiveCases.tsx`
- Modify: `src/app/inbox/liveCaseCompatibility.ts`
- Modify: `src/app/inbox/liveCaseCompatibility.test.ts`

**Interfaces:**
- Consumes: the complete backend and frontend changes.
- Produces: a verified release with temporary compatibility removed after backend deployment.

- [ ] **Step 1: Run all automated checks.**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: 33 or more test files pass, lint and TypeScript print no errors, and the Next.js production build succeeds.

- [ ] **Step 2: Deploy the Convex contract first.** Run `npx convex deploy`, open the existing inbox against that deployment, and confirm one returned row has `conversation.completeness`, full message bodies, `agentHandoff`, and `replyCapability`. Do not deploy the dependent frontend until this response is verified.
- [ ] **Step 3: Test a sent clarification.** Poll a case that triggers clarification. Confirm the exact outgoing body appears as an outbound message and the status says **Clarification sent** only after its message record reports `sent`.
- [ ] **Step 4: Test a human-review case as founder.** Confirm the real stop reason and recommendation appear, type a unique reply, switch to another row and back to prove the draft survives, send once, and verify all of these results: Gmail contains one message in the original thread, the inbox shows that exact body as **Founder reply**, the case is closed, and one reply example exists.
- [ ] **Step 5: Test blocked roles and states.** As a support agent, confirm the read-only reason appears. On the closed case, confirm there is no active send button. Call the reply action against that closed case and confirm the server rejects it.
- [ ] **Step 6: Test an unknown-delivery retry.** Force the Gmail response handling path to fail after request start. Confirm the typed body remains and no immediate second Gmail request occurs. Then test both reconciliation outcomes: an existing stable Message-ID is recorded without resending, while no Gmail match permits exactly one guarded resend with the same Message-ID.
- [ ] **Step 7: Review at desktop and mobile widths.** Check at 1440×900 and 375×812. Verify no horizontal scroll, long email addresses wrap, every control is keyboard reachable, focus is visible, and the message → handoff → reply hierarchy remains clear.
- [ ] **Step 8: Remove temporary optional contract fields.** After the deployed query is confirmed, make `conversation` and `replyCapability` required in `ReceivedCase`, delete the source-only rollout fallback, and update its test to assert the final required contract. Keep a visible query error state; do not silently fabricate missing backend data.
- [ ] **Step 9: Run the full automated checks again.** Expect the same clean result as Step 1.
- [ ] **Step 10: Commit.**

```bash
git add src/app/inbox/LiveCases.tsx src/app/inbox/liveCaseCompatibility.ts src/app/inbox/liveCaseCompatibility.test.ts
git commit -m "chore: finish inbox conversation rollout"
```

## Self-review

- Spec coverage: delivered-message truth, agent handoff, unsent draft labeling, founder composer access, support-agent explanation, closed-case enforcement, draft preservation, retry safety, rollout order, responsive layout, and live Gmail verification each map to a task.
- Placeholder scan: no deferred implementation markers or unspecified error-handling steps remain.
- Type consistency: `conversation`, `agentHandoff`, `replyCapability`, `ManualReplyCapability`, `deliveryState`, and `delivery_unknown` use the same names across backend, client, and tests.

## Companion plan

Implement `docs/superpowers/plans/2026-09-05-inbox-observability.md` after Task 4 so its activity surface can consume the repaired conversation and handoff contract. It remains independently testable and does not turn the future History archive into a log viewer.
