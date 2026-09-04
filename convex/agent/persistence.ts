import type { AgentRunStatus, AgentSafeToolOutput, AgentToolName } from "./contracts";

type LeaseState = {
  status: AgentRunStatus;
  leaseVersion: number;
  leaseExpiresAt?: number;
};

type CallIdentity = { callId: string };
type NamedCallIdentity = CallIdentity & { name: AgentToolName };

const terminalStatuses = new Set<AgentRunStatus>(["completed", "failed", "escalated"]);

export function assertLeaseWriteAllowed(
  run: LeaseState,
  expectedLeaseVersion: number,
  now: number,
) {
  if (terminalStatuses.has(run.status)) throw new Error("Agent run is terminal");
  if (run.status !== "running") throw new Error("Agent run is not claimed");
  if (run.leaseVersion !== expectedLeaseVersion) throw new Error("Agent run lease is stale");
  if (run.leaseExpiresAt === undefined || run.leaseExpiresAt <= now) {
    throw new Error("Agent run lease has expired");
  }
}

export function assertExactToolBatch(
  pendingCalls: CallIdentity[],
  outputs: CallIdentity[],
) {
  const pendingIds = pendingCalls.map((call) => call.callId);
  const outputIds = outputs.map((output) => output.callId);
  if (new Set(pendingIds).size !== pendingIds.length) {
    throw new Error("Pending agent calls contain duplicate call IDs");
  }
  if (new Set(outputIds).size !== outputIds.length) {
    throw new Error("Tool output batch contains duplicate call IDs");
  }
  if (
    pendingIds.length !== outputIds.length ||
    pendingIds.some((callId) => !outputIds.includes(callId))
  ) {
    throw new Error("Tool output batch must exactly match pending calls");
  }
}

export function persistExactToolBatch(
  pendingCalls: NamedCallIdentity[],
  outputs: AgentSafeToolOutput[],
): AgentSafeToolOutput[] {
  assertExactToolBatch(pendingCalls, outputs);
  for (const output of outputs) {
    const pending = pendingCalls.find((call) => call.callId === output.callId);
    if (!pending || pending.name !== output.name) {
      throw new Error(`Tool output name does not match pending call: ${output.callId}`);
    }
  }
  return outputs.map((output) => ({
    callId: output.callId,
    name: output.name,
    result: output.result,
  }));
}
