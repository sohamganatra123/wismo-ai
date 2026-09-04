export type AutonomyMode = "investigate" | "approval" | "verified";
export type ActionKind =
  | "customer_email"
  | "courier_email"
  | "shopify_note"
  | "shopify_tracking";
export type PolicyDecision = "observe" | "approval" | "execute" | "escalate";

export type ActionPolicyInput = {
  mode: AutonomyMode;
  proofComplete: boolean;
  kind: ActionKind;
  exactIdentity: boolean;
  orderResolved: boolean;
  exactTracking: boolean;
  unambiguousScan: boolean;
  hasConflict: boolean;
  isCorrection: boolean;
  alreadyExecuted: boolean;
  courierConfigured: boolean;
};

export function evaluateAction(input: ActionPolicyInput): PolicyDecision {
  if (input.alreadyExecuted || input.hasConflict || !input.exactIdentity) {
    return "escalate";
  }
  if (input.mode === "investigate") return "observe";
  if (input.mode === "approval") return "approval";
  if (!input.proofComplete) return "approval";

  if (input.kind === "shopify_note" || input.kind === "shopify_tracking") {
    return "approval";
  }
  if (input.isCorrection || !input.orderResolved) return "approval";
  if (input.kind === "courier_email") {
    return input.courierConfigured ? "execute" : "escalate";
  }
  return input.exactTracking && input.unambiguousScan ? "execute" : "approval";
}
