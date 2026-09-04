export type SafetyResult = { allowed: true } | { allowed: false; reasons: string[] };

export function verifiedCustomerAction(input: {
  exactIdentity: boolean;
  orderResolved: boolean;
  orderTrackingNumber?: string;
  scanTrackingNumber?: string;
  scanIsNewest: boolean;
  hasConflict: boolean;
  isCorrection: boolean;
  proofComplete: boolean;
  alreadyExecuted: boolean;
}): SafetyResult {
  const reasons: string[] = [];
  if (!input.exactIdentity) reasons.push("identity_not_exact");
  if (!input.orderResolved) reasons.push("order_not_resolved");
  if (!input.orderTrackingNumber || !input.scanTrackingNumber) reasons.push("tracking_missing");
  else if (input.orderTrackingNumber !== input.scanTrackingNumber) reasons.push("tracking_number_mismatch");
  if (!input.scanIsNewest) reasons.push("tracking_scan_stale");
  if (input.hasConflict) reasons.push("tracking_conflict");
  if (input.isCorrection) reasons.push("correction_requires_approval");
  if (!input.proofComplete) reasons.push("proof_required");
  if (input.alreadyExecuted) reasons.push("already_executed");
  return reasons.length ? { allowed: false, reasons } : { allowed: true };
}
