import { describe, expect, it } from "vitest";
import { aggregateConversationUsage, hasAgentResponse } from "./observability";

describe("conversation observability", () => {
  it("aggregates tokens and estimates cost across every run", () => {
    expect(aggregateConversationUsage([
      { inputTokens: 120, outputTokens: 30 },
      { inputTokens: 80, outputTokens: 10 },
    ], "gpt-5-mini")).toEqual({
      inputTokens: 200,
      outputTokens: 40,
      totalTokens: 240,
      estimatedCostUsd: 0.00013,
    });
  });

  it("recognizes an agent response even when no run is linked", () => {
    expect(hasAgentResponse([
      { party: "customer", kind: "customer" },
      { party: "support", kind: "agent_reply" },
    ])).toBe(true);
    expect(hasAgentResponse([{ party: "support", kind: "founder_reply" }])).toBe(false);
  });
});
