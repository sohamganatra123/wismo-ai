export type ExternalActionKind = "customer_email" | "courier_email" | "shopify_note" | "shopify_tracking";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "executing" | "completed" | "failed";

export type ExternalActionGuard = {
  kind: ExternalActionKind;
  approvalStatus: ApprovalStatus;
  alreadyExecuted: boolean;
};

export function canExecuteExternalAction(action: ExternalActionGuard) {
  return action.approvalStatus === "approved" && !action.alreadyExecuted;
}

export function createActionKey(caseId: string, kind: ExternalActionKind, revision: number) {
  if (!caseId || !Number.isInteger(revision) || revision < 1) throw new Error("Invalid action key input");
  return `${caseId}:${kind}:${revision}`;
}
