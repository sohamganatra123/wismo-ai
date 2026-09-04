import { describe, expect, it } from "vitest";
import { agentTools, validateAgentToolArguments } from "./toolSchemas";

describe("agent tool schemas", () => {
  it("keeps a small, strict, closed tool set", () => {
    expect(agentTools).toHaveLength(8);
    expect(agentTools.map((tool) => tool.name)).toEqual([
      "read_case_context",
      "match_shopify_customer",
      "select_only_order",
      "collect_order_evidence",
      "prepare_customer_update",
      "prepare_identity_request",
      "prepare_courier_request",
      "escalate_case",
    ]);

    for (const tool of agentTools) {
      expect(tool.strict).toBe(true);
      expect(tool.parameters.additionalProperties).toBe(false);
    }
  });

  it("requires every declared argument", () => {
    for (const tool of agentTools) {
      expect(tool.parameters.required).toEqual(
        Object.keys(tool.parameters.properties),
      );
    }
  });
});

describe("validateAgentToolArguments", () => {
  it("accepts exact required string arguments", () => {
    expect(
      validateAgentToolArguments("prepare_customer_update", {
        reason: "The newest tracking scan is clear",
        draft: "Your order is still moving.",
      }),
    ).toEqual({
      reason: "The newest tracking scan is clear",
      draft: "Your order is still moving.",
    });
  });

  it("rejects extra arguments, including on argument-free tools", () => {
    expect(() =>
      validateAgentToolArguments("prepare_courier_request", {
        question: "Where is this parcel?",
        email: "private@example.com",
      }),
    ).toThrow("Unexpected argument");
    expect(() =>
      validateAgentToolArguments("read_case_context", { caseId: "case-1" }),
    ).toThrow("Unexpected argument");
  });

  it("rejects missing and empty required strings", () => {
    expect(() =>
      validateAgentToolArguments("prepare_customer_update", {
        reason: "Evidence is clear",
      }),
    ).toThrow("prepare_customer_update.draft");
    expect(() =>
      validateAgentToolArguments("prepare_courier_request", { question: "  " }),
    ).toThrow("prepare_courier_request.question");
    expect(() =>
      validateAgentToolArguments("escalate_case", {
        reason: "Tracking conflicts",
        recommendation: "",
      }),
    ).toThrow("escalate_case.recommendation");
  });
});
