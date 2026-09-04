export type ExistingApproval = {
  caseId: string;
  kind: string;
  payload: unknown;
  status: "pending" | "approved" | "rejected" | "executing" | "completed" | "failed";
};

export function validateApprovalReuse(
  existing: ExistingApproval,
  expected: { caseId: string; kind: string; payload: unknown },
) {
  if (existing.caseId !== expected.caseId || existing.kind !== expected.kind) {
    throw new Error("Approval action key belongs to a different case or action kind");
  }
  if (JSON.stringify(existing.payload) !== JSON.stringify(expected.payload)) {
    throw new Error("Approval action key payload does not match its original proposal");
  }
  return existing.status;
}

export function validateToolReplay(
  existing: { name: string; result: unknown },
  expectedName: string,
) {
  if (existing.name !== expectedName) {
    throw new Error("Persisted tool result name does not match the replayed call");
  }
  return existing.result;
}
