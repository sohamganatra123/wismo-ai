const pricingPerMillion: Record<string, { input: number; output: number }> = {
  "gpt-5-mini": { input: 0.25, output: 2 },
  "gpt-5": { input: 1.25, output: 10 },
};

export function estimateAgentCostUsd(input: { model: string; inputTokens: number; outputTokens: number }) {
  const pricing = pricingPerMillion[input.model];
  if (!pricing) return null;
  return Number(((input.inputTokens / 1_000_000) * pricing.input + (input.outputTokens / 1_000_000) * pricing.output).toFixed(8));
}
