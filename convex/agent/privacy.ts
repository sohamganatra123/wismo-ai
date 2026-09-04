import type {
  AgentModelContext,
  AgentSafeToolOutput,
  AgentSafeToolResult,
} from "./contracts";
import { isAgentToolName } from "./toolSchemas";
import { validateAgentToolArguments } from "./toolSchemas";

const contextKeys = new Set([
  "caseStatus", "subject", "body", "priorSupportMessages", "identityMatched",
  "orderResolved", "orderCount", "orderName", "lineItems", "fulfillmentStatus",
  "trackingNumber", "snapshotAt", "latestTracking", "hasConflict", "workspacePolicy",
  "founderReplyExamples",
]);
const resultKeys = new Set([
  "status", "summary", "reason", "recommendation", "identityMatched",
  "orderResolved", "orderCount", "orderName", "lineItems", "fulfillmentStatus",
  "trackingNumber", "latestTracking", "hasConflict", "actionKey", "blocked",
]);
const scanKeys = new Set(["status", "eventTime", "source"]);
const policyKeys = new Set(["mode", "proofComplete"]);
const messageKeys = new Set(["subject", "body"]);
const replyExampleKeys = new Set(["customerMessage", "founderReply"]);
const outputKeys = new Set(["callId", "name", "result"]);
const policyAuditKeys = new Set([
  "mode", "proofComplete", "exactIdentity", "orderResolved", "exactTracking",
  "unambiguousScan", "hasConflict", "isCorrection", "alreadyExecuted",
  "actionKind", "decision", "reason",
]);
const modelStepOutputKeys = new Set([
  "status", "responseId", "callCount", "finalText", "inputTokens", "outputTokens",
]);
const policyStepOutputKeys = new Set(["decision", "reason", "actionKind"]);

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, allowed: Set<string>, label: string) {
  const extra = Object.keys(value).find((key) => !allowed.has(key));
  if (extra) throw new Error(`${label} contains disallowed field: ${extra}`);
}

function text(value: unknown, label: string, maximum: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  if (value.length > maximum) throw new Error(`${label} exceeds ${maximum} characters`);
  return value;
}

function optionalText(value: unknown, label: string, maximum: number) {
  return value === undefined ? undefined : text(value, label, maximum);
}

function optionalBoolean(value: unknown, label: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw new Error(`${label} must be a boolean`);
  return value;
}

function optionalNumber(value: unknown, label: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }
  return value;
}

function stringList(value: unknown, label: string, maximumItems: number): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > maximumItems) {
    throw new Error(`${label} must contain at most ${maximumItems} items`);
  }
  return value.map((item, index) => text(item, `${label}[${index}]`, 300));
}

function safeScan(value: unknown, label: string) {
  if (value === undefined) return undefined;
  const item = record(value, label);
  exactKeys(item, scanKeys, label);
  return {
    status: text(item.status, `${label}.status`, 120),
    eventTime: text(item.eventTime, `${label}.eventTime`, 120),
    source: text(item.source, `${label}.source`, 120),
  };
}

export function assertAgentModelContext(value: AgentModelContext): AgentModelContext {
  const item = record(value, "Agent model context");
  exactKeys(item, contextKeys, "Agent model context");
  if (!Array.isArray(item.priorSupportMessages) || item.priorSupportMessages.length > 8) {
    throw new Error("priorSupportMessages must contain at most 8 items");
  }
  const priorSupportMessages = item.priorSupportMessages.map((message, index) => {
    const entry = record(message, `priorSupportMessages[${index}]`);
    exactKeys(entry, messageKeys, `priorSupportMessages[${index}]`);
    return {
      subject: text(entry.subject, `priorSupportMessages[${index}].subject`, 300),
      body: text(entry.body, `priorSupportMessages[${index}].body`, 2_000),
    };
  });

  let founderReplyExamples: AgentModelContext["founderReplyExamples"];
  if (item.founderReplyExamples !== undefined) {
    if (!Array.isArray(item.founderReplyExamples) || item.founderReplyExamples.length > 5) {
      throw new Error("founderReplyExamples must contain at most 5 items");
    }
    founderReplyExamples = item.founderReplyExamples.map((example, index) => {
      const entry = record(example, `founderReplyExamples[${index}]`);
      exactKeys(entry, replyExampleKeys, `founderReplyExamples[${index}]`);
      return {
        customerMessage: text(
          entry.customerMessage,
          `founderReplyExamples[${index}].customerMessage`,
          2_000,
        ),
        founderReply: text(
          entry.founderReply,
          `founderReplyExamples[${index}].founderReply`,
          2_000,
        ),
      };
    });
  }

  let workspacePolicy: AgentModelContext["workspacePolicy"];
  if (item.workspacePolicy !== undefined) {
    const policy = record(item.workspacePolicy, "workspacePolicy");
    exactKeys(policy, policyKeys, "workspacePolicy");
    if (!new Set(["investigate", "approval", "verified"]).has(String(policy.mode))) {
      throw new Error("workspacePolicy.mode is invalid");
    }
    if (typeof policy.proofComplete !== "boolean") {
      throw new Error("workspacePolicy.proofComplete must be a boolean");
    }
    workspacePolicy = {
      mode: policy.mode as "investigate" | "approval" | "verified",
      proofComplete: policy.proofComplete,
    };
  }

  return {
    caseStatus: text(item.caseStatus, "caseStatus", 120),
    subject: text(item.subject, "subject", 300),
    body: text(item.body, "body", 8_000),
    priorSupportMessages,
    founderReplyExamples,
    identityMatched: optionalBoolean(item.identityMatched, "identityMatched"),
    orderResolved: optionalBoolean(item.orderResolved, "orderResolved"),
    orderCount: optionalNumber(item.orderCount, "orderCount"),
    orderName: optionalText(item.orderName, "orderName", 300),
    lineItems: stringList(item.lineItems, "lineItems", 20),
    fulfillmentStatus: optionalText(item.fulfillmentStatus, "fulfillmentStatus", 120),
    trackingNumber: optionalText(item.trackingNumber, "trackingNumber", 300),
    snapshotAt: optionalNumber(item.snapshotAt, "snapshotAt"),
    latestTracking: safeScan(item.latestTracking, "latestTracking"),
    hasConflict: optionalBoolean(item.hasConflict, "hasConflict"),
    workspacePolicy,
  };
}

function safeToolResult(value: unknown): AgentSafeToolResult {
  const item = record(value, "Safe tool result");
  exactKeys(item, resultKeys, "Safe tool result");
  const result = {
    status: text(item.status, "result.status", 120),
    summary: optionalText(item.summary, "result.summary", 2_000),
    reason: optionalText(item.reason, "result.reason", 2_000),
    recommendation: optionalText(item.recommendation, "result.recommendation", 2_000),
    identityMatched: optionalBoolean(item.identityMatched, "result.identityMatched"),
    orderResolved: optionalBoolean(item.orderResolved, "result.orderResolved"),
    orderCount: optionalNumber(item.orderCount, "result.orderCount"),
    orderName: optionalText(item.orderName, "result.orderName", 300),
    lineItems: stringList(item.lineItems, "result.lineItems", 20),
    fulfillmentStatus: optionalText(item.fulfillmentStatus, "result.fulfillmentStatus", 120),
    trackingNumber: optionalText(item.trackingNumber, "result.trackingNumber", 300),
    latestTracking: safeScan(item.latestTracking, "result.latestTracking"),
    hasConflict: optionalBoolean(item.hasConflict, "result.hasConflict"),
    actionKey: optionalText(item.actionKey, "result.actionKey", 300),
    blocked: optionalBoolean(item.blocked, "result.blocked"),
  };
  return Object.fromEntries(
    Object.entries(result).filter(([, itemValue]) => itemValue !== undefined),
  ) as AgentSafeToolResult;
}

export function assertAgentSafeToolResult(value: unknown): AgentSafeToolResult {
  return safeToolResult(value);
}

export function assertAgentSafeToolOutputs(value: AgentSafeToolOutput[]): AgentSafeToolOutput[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 8) {
    throw new Error("Tool outputs must contain between 1 and 8 items");
  }
  const callIds = new Set<string>();
  return value.map((output, index) => {
    const item = record(output, `Tool output ${index}`);
    exactKeys(item, outputKeys, `Tool output ${index}`);
    const callId = text(item.callId, `Tool output ${index}.callId`, 200);
    if (callIds.has(callId)) throw new Error(`Duplicate tool output call ID: ${callId}`);
    callIds.add(callId);
    if (typeof item.name !== "string" || !isAgentToolName(item.name)) {
      throw new Error(`Tool output ${index}.name is invalid`);
    }
    return { callId, name: item.name, result: safeToolResult(item.result) };
  });
}

export function assertAgentStepInput(input: {
  kind: "model" | "tool" | "policy";
  name: string;
  value: unknown;
}): unknown {
  if (input.kind === "model") {
    return assertAgentModelContext(input.value as AgentModelContext);
  }
  if (input.kind === "tool") {
    if (!isAgentToolName(input.name)) throw new Error(`Unknown agent tool: ${input.name}`);
    return validateAgentToolArguments(input.name, input.value);
  }

  const item = record(input.value, "Policy audit input");
  exactKeys(item, policyAuditKeys, "Policy audit input");
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (typeof value === "string") result[key] = text(value, `Policy audit input.${key}`, 2_000);
    else if (typeof value === "boolean") result[key] = value;
    else throw new Error(`Policy audit input.${key} has an invalid type`);
  }
  return result;
}

export function assertAgentStepOutput(input: {
  kind: "model" | "tool" | "policy";
  name: string;
  value: unknown;
}): unknown {
  if (input.kind === "tool") {
    if (!isAgentToolName(input.name)) throw new Error(`Unknown agent tool: ${input.name}`);
    return assertAgentSafeToolResult(input.value);
  }
  if (input.kind === "model") {
    const item = record(input.value, "Model step output");
    exactKeys(item, modelStepOutputKeys, "Model step output");
    const status = text(item.status, "Model step output.status", 120);
    if (!new Set(["completed", "tool_calls", "final"]).has(status)) {
      throw new Error("Model step output.status is invalid");
    }
    const responseId = text(item.responseId, "Model step output.responseId", 200);
    const callCount = optionalNumber(item.callCount, "Model step output.callCount");
    const inputTokens = optionalNumber(item.inputTokens, "Model step output.inputTokens");
    const outputTokens = optionalNumber(item.outputTokens, "Model step output.outputTokens");
    if (callCount === undefined || inputTokens === undefined || outputTokens === undefined) {
      throw new Error("Model step output requires call and token counts");
    }
    const result = {
      status,
      responseId,
      callCount,
      finalText: optionalText(item.finalText, "Model step output.finalText", 4_000),
      inputTokens,
      outputTokens,
    };
    return Object.fromEntries(
      Object.entries(result).filter(([, itemValue]) => itemValue !== undefined),
    );
  }

  const item = record(input.value, "Policy step output");
  exactKeys(item, policyStepOutputKeys, "Policy step output");
  const decision = text(item.decision, "Policy step output.decision", 120);
  if (!new Set(["observe", "approval", "execute", "escalate"]).has(decision)) {
    throw new Error("Policy step output.decision is invalid");
  }
  let actionKind: string | undefined;
  if (item.actionKind !== undefined) {
    actionKind = text(item.actionKind, "Policy step output.actionKind", 120);
    if (!new Set([
      "customer_email", "courier_email", "shopify_note", "shopify_tracking",
    ]).has(actionKind)) {
      throw new Error("Policy step output.actionKind is invalid");
    }
  }
  return {
    decision,
    reason: text(item.reason, "Policy step output.reason", 2_000),
    ...(actionKind === undefined ? {} : { actionKind }),
  };
}
