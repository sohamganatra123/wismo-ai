import { describe, expect, it } from "vitest";
import { formatConversationUsage } from "./observabilityPresentation";

describe("observability presentation", () => {
  it("shows the conversation-wide token split and cost", () => {
    expect(formatConversationUsage({
      inputTokens: 200,
      outputTokens: 40,
      totalTokens: 240,
      estimatedCostUsd: 0.00013,
    })).toBe("240 model tokens (200 input · 40 output) · Estimated model cost $0.000130");
  });

  it("does not invent a cost when usage is unavailable", () => {
    expect(formatConversationUsage({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: null,
    })).toContain("Estimated model cost unavailable");
  });
});
