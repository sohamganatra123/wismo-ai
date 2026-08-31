export const caseStatuses = [
  "received",
  "classifying",
  "identity_needed",
  "order_needed",
  "investigating",
  "awaiting_approval",
  "awaiting_courier",
  "human_attention",
  "delivery_confirmed",
  "closed",
] as const;

export type CaseStatus = (typeof caseStatuses)[number];

const transitions: Record<CaseStatus, ReadonlySet<CaseStatus>> = {
  received: new Set(["classifying", "human_attention"]),
  classifying: new Set(["identity_needed", "order_needed", "investigating", "awaiting_approval", "human_attention"]),
  identity_needed: new Set(["order_needed", "investigating", "awaiting_approval", "human_attention"]),
  order_needed: new Set(["investigating", "awaiting_approval", "human_attention"]),
  investigating: new Set(["awaiting_approval", "awaiting_courier", "human_attention", "delivery_confirmed"]),
  awaiting_approval: new Set(["investigating", "awaiting_courier", "human_attention", "delivery_confirmed"]),
  awaiting_courier: new Set(["investigating", "awaiting_approval", "human_attention"]),
  human_attention: new Set(["investigating", "awaiting_approval", "delivery_confirmed"]),
  delivery_confirmed: new Set(["closed", "human_attention"]),
  closed: new Set(["human_attention"]),
};

export function canTransitionCase(from: CaseStatus, to: CaseStatus) {
  return transitions[from].has(to);
}

export function assertCaseTransition(from: CaseStatus, to: CaseStatus) {
  if (!canTransitionCase(from, to)) throw new Error(`Illegal case transition: ${from} -> ${to}`);
}
