import { describe, expect, it } from "vitest";
import type { AgentRoundState } from "./contracts";
import { decideRound } from "./runtime";
import { assertLeaseWriteAllowed } from "./persistence";

function state(overrides: Partial<AgentRoundState> = {}): AgentRoundState {
  return {
    runId: "run-1",
    caseId: "case-1",
    status: "running",
    round: 0,
    leaseVersion: 2,
    pendingCalls: [],
    pendingToolOutputs: [],
    completedProposalCalls: [],
    context: {
      caseStatus: "investigating",
      subject: "Where is my order?",
      body: "Please send an update.",
      priorSupportMessages: [],
    },
    ...overrides,
  };
}

describe("agent round bounds", () => {
  it("stops after eight model/tool rounds", () => {
    expect(decideRound(state({ round: 8 }))).toMatchObject({
      kind: "escalate",
      reason: "Agent exceeded the eight-round tool limit",
    });
  });

  it("blocks a mutating proposal that already completed", () => {
    expect(
      decideRound(
        state({
          completedProposalCalls: [
            { callId: "call-1", name: "prepare_customer_update" },
          ],
          pendingCalls: [
            {
              callId: "call-2",
              name: "prepare_customer_update",
              arguments: { reason: "same", draft: "same" },
            },
          ],
        }),
      ),
    ).toMatchObject({ kind: "escalate" });
  });

  it("blocks duplicate mutating proposals before either can execute", () => {
    const repeated = {
      name: "prepare_identity_request" as const,
      arguments: {},
    };
    expect(
      decideRound(
        state({
          pendingCalls: [
            { callId: "call-1", ...repeated },
            { callId: "call-2", ...repeated },
          ],
        }),
      ),
    ).toMatchObject({ kind: "escalate" });
  });

  it("allows the same call ID to replay after a crash", () => {
    expect(
      decideRound(
        state({
          completedProposalCalls: [
            { callId: "call-1", name: "prepare_customer_update" },
          ],
          pendingCalls: [
            {
              callId: "call-1",
              name: "prepare_customer_update",
              arguments: { reason: "safe", draft: "Update" },
            },
          ],
        }),
      ),
    ).toMatchObject({ kind: "tools" });
  });
});

describe("tool-side-effect lease guard", () => {
  it("rejects stale and expired dispatches before a tool can write", () => {
    const leased = {
      status: "running" as const,
      leaseVersion: 4,
      leaseExpiresAt: 2_000,
    };
    expect(() => assertLeaseWriteAllowed(leased, 3, 1_000)).toThrow("stale");
    expect(() => assertLeaseWriteAllowed(leased, 4, 2_000)).toThrow("expired");
  });
});
