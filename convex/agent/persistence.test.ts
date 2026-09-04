import { describe, expect, it } from "vitest";
import { buildAgentContinuationInput, parseAgentResponse } from "./openai";
import {
  assertExactToolBatch,
  assertLeaseWriteAllowed,
  persistExactToolBatch,
} from "./persistence";

const activeRun = {
  status: "running" as const,
  leaseVersion: 4,
  leaseExpiresAt: 2_000,
};

describe("agent run fencing", () => {
  it("rejects a stale lease", () => {
    expect(() => assertLeaseWriteAllowed(activeRun, 3, 1_000)).toThrow("stale");
  });

  it("rejects mutation after a run becomes terminal", () => {
    expect(() =>
      assertLeaseWriteAllowed({ ...activeRun, status: "completed" }, 4, 1_000),
    ).toThrow("terminal");
  });
});

describe("atomic tool batches", () => {
  const pending = [{ callId: "call_1" }, { callId: "call_2" }];

  it("rejects partial and duplicate batches", () => {
    expect(() => assertExactToolBatch(pending, [{ callId: "call_1" }])).toThrow("exactly");
    expect(() =>
      assertExactToolBatch(pending, [{ callId: "call_1" }, { callId: "call_1" }]),
    ).toThrow("duplicate");
  });

  it("accepts the exact unique pending call set", () => {
    expect(() =>
      assertExactToolBatch(pending, [{ callId: "call_2" }, { callId: "call_1" }]),
    ).not.toThrow();
  });

  it("round-trips parsed calls through durable state into a valid continuation", () => {
    const response = parseAgentResponse({
      id: "resp_1",
      status: "completed",
      output: [
        {
          type: "function_call",
          call_id: "call_1",
          name: "read_case_context",
          arguments: "{}",
        },
      ],
    });
    const persisted = persistExactToolBatch(response.calls, [
      {
        callId: "call_1",
        name: "read_case_context",
        result: { status: "completed", summary: "Safe context loaded" },
      },
    ]);
    const reloaded = JSON.parse(JSON.stringify(persisted));

    expect(buildAgentContinuationInput(reloaded)).toEqual([
      {
        type: "function_call_output",
        call_id: "call_1",
        output: JSON.stringify({
          name: "read_case_context",
          status: "completed",
          summary: "Safe context loaded",
        }),
      },
    ]);
  });

  it("rejects a result stored under the wrong tool name", () => {
    expect(() =>
      persistExactToolBatch(
        [{ callId: "call_1", name: "read_case_context" }],
        [
          {
            callId: "call_1",
            name: "collect_order_evidence",
            result: { status: "completed" },
          },
        ],
      ),
    ).toThrow("does not match");
  });
});
