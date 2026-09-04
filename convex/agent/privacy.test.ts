import { describe, expect, it } from "vitest";
import {
  assertAgentModelContext,
  assertAgentSafeToolOutputs,
  assertAgentStepInput,
  assertAgentStepOutput,
} from "./privacy";

describe("agent persistence privacy boundary", () => {
  const baseContext = {
    caseStatus: "human_attention",
    subject: "Where is my order?",
    body: "Please help with order 4921.",
    priorSupportMessages: [],
  };

  it("accepts a bounded founder reply example", () => {
    expect(
      assertAgentModelContext({
        ...baseContext,
        founderReplyExamples: [
          {
            customerMessage: "My parcel is late.",
            founderReply: "I checked this personally and will update you tomorrow.",
          },
        ],
      }),
    ).toMatchObject({
      founderReplyExamples: [
        {
          customerMessage: "My parcel is late.",
          founderReply: "I checked this personally and will update you tomorrow.",
        },
      ],
    });
  });

  it("rejects unbounded or undeclared founder reply example data", () => {
    expect(() =>
      assertAgentModelContext({
        ...baseContext,
        founderReplyExamples: Array.from({ length: 6 }, () => ({
          customerMessage: "Question",
          founderReply: "Reply",
        })),
      }),
    ).toThrow("at most 5");
    expect(() =>
      assertAgentModelContext({
        ...baseContext,
        founderReplyExamples: [
          { customerMessage: "Question", founderReply: "Reply", secret: "no" },
        ],
      } as never),
    ).toThrow("disallowed field");
    expect(() =>
      assertAgentModelContext({
        ...baseContext,
        founderReplyExamples: [
          { customerMessage: "Question", founderReply: "x".repeat(2_001) },
        ],
      }),
    ).toThrow("exceeds 2000");
  });

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
