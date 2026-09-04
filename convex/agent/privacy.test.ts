import { describe, expect, it } from "vitest";
import {
  assertAgentSafeToolOutputs,
  assertAgentStepInput,
  assertAgentStepOutput,
} from "./privacy";

describe("agent persistence privacy boundary", () => {
  it("rejects undeclared fields nested inside a safe tool result", () => {
    expect(() =>
      assertAgentSafeToolOutputs([
        {
          callId: "call_1",
          name: "read_case_context",
          result: {
            status: "completed",
            secret: "must not persist",
          },
        },
      ] as never),
    ).toThrow("disallowed field");
  });

  it("validates tool step input before audit projection", () => {
    expect(() =>
      assertAgentStepInput({
        kind: "tool",
        name: "prepare_courier_request",
        value: { question: "Where is the parcel?", authorization: "secret" },
      }),
    ).toThrow("Unexpected argument");
  });

  it("accepts closed model, tool, and policy step outputs", () => {
    expect(
      assertAgentStepOutput({
        kind: "model",
        name: "response",
        value: {
          status: "tool_calls",
          responseId: "resp_1",
          callCount: 1,
          inputTokens: 20,
          outputTokens: 5,
        },
      }),
    ).toMatchObject({ responseId: "resp_1", callCount: 1 });
    expect(
      assertAgentStepOutput({
        kind: "tool",
        name: "read_case_context",
        value: { status: "completed", summary: "Context loaded" },
      }),
    ).toEqual({ status: "completed", summary: "Context loaded" });
    expect(
      assertAgentStepOutput({
        kind: "policy",
        name: "customer_update",
        value: {
          decision: "approval",
          reason: "Founder approval is required",
          actionKind: "customer_email",
        },
      }),
    ).toMatchObject({ decision: "approval", actionKind: "customer_email" });
  });

  it("rejects undeclared and nested step output fields", () => {
    expect(() =>
      assertAgentStepOutput({
        kind: "model",
        name: "response",
        value: {
          status: "completed",
          responseId: "resp_1",
          callCount: 0,
          inputTokens: 20,
          outputTokens: 5,
          rawResponse: { authorization: "secret" },
        },
      }),
    ).toThrow("disallowed field");
    expect(() =>
      assertAgentStepOutput({
        kind: "policy",
        name: "customer_update",
        value: {
          decision: "approval",
          reason: { text: "nested values are not allowed" },
        },
      }),
    ).toThrow("non-empty string");
  });
});
