import { describe, expect, it } from "vitest";
import type { MutationCtx } from "../_generated/server";
import { saveMatchInMutation } from "../shopifyData";
import { decideRound, executeToolCalls } from "./runtime";
import { dispatchToolInMutation } from "./tools";
import type { AgentToolCall } from "./contracts";

type Row = Record<string, unknown> & { _id: string };

function memoryCtx(seed: Record<string, Row[]>) {
  const tables = new Map<string, Row[]>(
    Object.entries(seed).map(([name, rows]) => [name, rows.map((row) => ({ ...row }))]),
  );
  let sequence = 0;
  const scheduled: Array<{ args: unknown }> = [];
  const rows = (table: string) => tables.get(table) ?? [];
  const query = (table: string) => {
    const filters: Array<[string, unknown]> = [];
    const builder = {
      eq(field: string, value: unknown) { filters.push([field, value]); return builder; },
    };
    const matched = () => rows(table).filter((row) =>
      filters.every(([field, value]) => row[field] === value),
    );
    const result = {
      withIndex(_name: string, apply: (q: typeof builder) => unknown) { apply(builder); return result; },
      async collect() { return matched(); },
      async first() { return matched()[0] ?? null; },
      async unique() {
        const found = matched();
        if (found.length > 1) throw new Error("Expected unique row");
        return found[0] ?? null;
      },
    };
    return result;
  };
  const ctx = {
    db: {
      query,
      async get(id: string) {
        return [...tables.values()].flat().find((row) => row._id === id) ?? null;
      },
      async insert(table: string, value: Record<string, unknown>) {
        const id = `${table}-${++sequence}`;
        tables.set(table, [...rows(table), { _id: id, ...value }]);
        return id;
      },
      async patch(id: string, value: Record<string, unknown>) {
        const row = [...tables.values()].flat().find((candidate) => candidate._id === id);
        if (!row) throw new Error(`Missing row ${id}`);
        Object.assign(row, value);
      },
      async delete(id: string) {
        for (const [table, values] of tables) {
          tables.set(table, values.filter((row) => row._id !== id));
        }
      },
    },
    scheduler: {
      async runAfter(_delay: number, _fn: unknown, args: unknown) { scheduled.push({ args }); },
    },
  };
  return { ctx: ctx as unknown as MutationCtx, tables, scheduled };
}

describe("automatic matched-order orchestration", () => {
  it("schedules the real run, collects evidence, and creates the real approval", async () => {
    const now = Date.now();
    const store = memoryCtx({
      cases: [{ _id: "case-1", sourceMessageId: "message-1", status: "received", identityAttempts: 0, createdAt: now, updatedAt: now }],
      messages: [{ _id: "message-1", providerId: "gmail-1", threadId: "thread-1", messageIdHeader: "<gmail-1@example.com>", direction: "inbound", party: "customer", from: "Amina <amina@example.com>", to: ["help@example.com"], subject: "Where is my order?", text: "Please send an update", hasAttachments: false, sentAt: now, caseId: "case-1" }],
      customers: [], orders: [], agentRuns: [], events: [], trackingScans: [],
      investigations: [], memories: [], approvals: [], agentToolResults: [],
    });

    await saveMatchInMutation(store.ctx, {
      caseId: "case-1" as never,
      shopifyCustomerId: "gid://shopify/Customer/1",
      name: "Amina",
      email: "amina@example.com",
      orders: [{ shopifyOrderId: "gid://shopify/Order/1", name: "#1001", createdAt: "2026-08-28T10:00:00Z", lineItems: ["Canvas backpack"], fulfillmentStatus: "IN_TRANSIT", trackingNumber: "TRK-1" }],
    });

    const run = store.tables.get("agentRuns")![0];
    const order = store.tables.get("orders")![0];
    expect(run).toMatchObject({ caseId: "case-1", status: "queued", trigger: "inbound" });
    expect(store.scheduled).toHaveLength(1);

    store.tables.get("trackingScans")!.push({ _id: "scan-1", orderId: order._id, trackingNumber: "TRK-1", status: "in_transit", eventTime: "2026-08-31T10:00:00Z", source: "fixture", recordedAt: now });
    const collectCalls: AgentToolCall[] = [{ callId: "collect-1", name: "collect_order_evidence", arguments: {} }];
    Object.assign(run, { status: "running", leaseVersion: 1, leaseExpiresAt: now + 60_000, pendingCalls: collectCalls });
    const collectDecision = decideRound({ runId: run._id, caseId: "case-1", status: "running", round: 1, leaseVersion: 1, pendingCalls: collectCalls, pendingToolOutputs: [], completedProposalCalls: [], context: { caseStatus: "investigating", subject: "Where is my order?", body: "Please send an update", priorSupportMessages: [] } });
    expect(collectDecision.kind).toBe("tools");
    if (collectDecision.kind !== "tools") throw new Error("Expected tool dispatch");
    await executeToolCalls(collectDecision.calls, {
      start: async (call) => call.callId,
      dispatch: (call) => dispatchToolInMutation(store.ctx, { runId: run._id as never, expectedLeaseVersion: 1, call }),
      finish: async () => undefined,
    });
    expect(store.tables.get("investigations")).toHaveLength(1);
    expect(store.tables.get("events")!.some((event) => event.type === "investigation_completed")).toBe(true);

    const prepareCalls: AgentToolCall[] = [{ callId: "prepare-1", name: "prepare_customer_update", arguments: { reason: "Exact tracking evidence", draft: "Your parcel is moving." } }];
    run.pendingCalls = prepareCalls;
    const prepareDecision = decideRound({ runId: run._id, caseId: "case-1", status: "running", round: 2, leaseVersion: 1, pendingCalls: prepareCalls, pendingToolOutputs: [], completedProposalCalls: [], context: { caseStatus: "investigating", subject: "Where is my order?", body: "Please send an update", priorSupportMessages: [] } });
    if (prepareDecision.kind !== "tools") throw new Error("Expected preparation dispatch");
    await executeToolCalls(prepareDecision.calls, {
      start: async (call) => call.callId,
      dispatch: (call) => dispatchToolInMutation(store.ctx, { runId: run._id as never, expectedLeaseVersion: 1, call }),
      finish: async () => undefined,
    });
    expect(store.tables.get("approvals")![0]).toMatchObject({ caseId: "case-1", kind: "customer_email", status: "pending" });
    expect(store.tables.get("events")!.some((event) => event.type === "customer_update_prepared")).toBe(true);
  });
});
