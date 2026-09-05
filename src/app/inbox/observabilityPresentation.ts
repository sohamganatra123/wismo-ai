export function formatConversationUsage(input: {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number | null;
}) {
  const cost = input.estimatedCostUsd === null
    ? "unavailable"
    : `$${input.estimatedCostUsd.toFixed(6)}`;
  return `${input.totalTokens} model tokens (${input.inputTokens} input · ${input.outputTokens} output) · Estimated model cost ${cost}`;
}
