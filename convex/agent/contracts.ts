export const agentToolNames = [
  "read_case_context",
  "match_shopify_customer",
  "select_only_order",
  "collect_order_evidence",
  "prepare_customer_update",
  "prepare_identity_request",
  "prepare_courier_request",
  "escalate_case",
] as const;

export type AgentToolName = (typeof agentToolNames)[number];

export type AgentToolCall = {
  callId: string;
  name: AgentToolName;
  arguments: Record<string, unknown>;
};

export type AgentModelContext = {
  caseStatus: string;
  subject: string;
  body: string;
  priorSupportMessages: Array<{ subject: string; body: string }>;
  identityMatched?: boolean;
  orderResolved?: boolean;
  orderCount?: number;
  orderName?: string;
  lineItems?: string[];
  fulfillmentStatus?: string;
  trackingNumber?: string;
  snapshotAt?: number;
  latestTracking?: {
    status: string;
    eventTime: string;
    source: string;
  };
  hasConflict?: boolean;
  workspacePolicy?: {
    mode: "investigate" | "approval" | "verified";
    proofComplete: boolean;
  };
};

export type AgentSafeToolResult = {
  status: string;
  summary?: string;
  reason?: string;
  recommendation?: string;
  identityMatched?: boolean;
  orderResolved?: boolean;
  orderCount?: number;
  orderName?: string;
  lineItems?: string[];
  fulfillmentStatus?: string;
  trackingNumber?: string;
  latestTracking?: {
    status: string;
    eventTime: string;
    source: string;
  };
  hasConflict?: boolean;
  actionKey?: string;
  blocked?: boolean;
};

export type AgentSafeToolOutput = {
  callId: string;
  name: AgentToolName;
  result: AgentSafeToolResult;
};

export type AgentRunStatus =
  | "queued"
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "escalated";

export type AgentResponse = {
  responseId: string;
  calls: AgentToolCall[];
  finalText: string;
  inputTokens: number;
  outputTokens: number;
};

export type AgentRoundState = {
  runId: string;
  caseId: string;
  status: AgentRunStatus;
  round: number;
  leaseVersion: number;
  previousResponseId?: string;
  pendingCalls: AgentToolCall[];
  pendingToolOutputs: AgentSafeToolOutput[];
  completedProposalCalls: Array<{ callId: string; name: AgentToolName }>;
  context: AgentModelContext;
};
