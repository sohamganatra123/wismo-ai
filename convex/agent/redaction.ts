import type { AgentToolName } from "./contracts";

type AuditStepKind = "model" | "tool" | "policy";

const modelContextFields = new Set([
  "caseStatus",
  "identityMatched",
  "orderResolved",
  "orderCount",
  "orderName",
  "lineItems",
  "fulfillmentStatus",
  "trackingNumber",
  "snapshotAt",
  "latestTracking",
  "status",
  "eventTime",
  "source",
  "hasConflict",
  "isCorrection",
  "alreadyExecuted",
  "workspacePolicy",
  "mode",
  "proofComplete",
]);

const policyFields = new Set([
  "mode",
  "proofComplete",
  "exactIdentity",
  "orderResolved",
  "exactTracking",
  "unambiguousScan",
  "hasConflict",
  "isCorrection",
  "alreadyExecuted",
  "actionKind",
  "decision",
  "reason",
]);

const auditOutputFields = new Set([
  ...modelContextFields,
  "ok",
  "status",
  "summary",
  "reason",
  "recommendation",
  "identityMatched",
  "orderResolved",
  "orderCount",
  "orderName",
  "fulfillmentStatus",
  "trackingNumber",
  "latestTracking",
  "eventTime",
  "source",
  "hasConflict",
  "actionKey",
  "blocked",
]);

const phonePattern = /(?:\+?\d[\d ().-]{7,}\d)/g;
const streetAddressPattern = /^.*\b(?:street|st\.?|road|rd\.?|avenue|ave\.?|lane|ln\.?|boulevard|blvd\.?|platz|strasse|straße|weg)\b.*$/gim;
const credentialLinePattern = /^.*\b(?:password|passcode|api[_ -]?key|access[_ -]?token|secret)\b.*$/gim;
const signatureStartPattern = /\n(?:--\s*|sent from my\b|best(?: regards)?[,]?\s*$|kind regards[,]?\s*$|regards[,]?\s*$)[\s\S]*$/im;

/** Removes high-risk free-text details before any message text reaches the model. */
export function redactSensitiveText(value: string): string {
  return value
    .replace(signatureStartPattern, "\n[signature removed]")
    .replace(credentialLinePattern, "[credential removed]")
    .replace(streetAddressPattern, "[street address removed]")
    .replace(phonePattern, "[phone removed]")
    .trim();
}

function project(value: unknown, allowed: Set<string>, depth = 0): unknown {
  if (depth > 8) return "[redacted: nesting limit]";
  if (Array.isArray(value)) {
    return value.map((item) => project(item, allowed, depth + 1));
  }
  if (value === null || typeof value !== "object") return value;

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (allowed.has(key)) result[key] = project(item, allowed, depth + 1);
  }
  return result;
}

export function toModelSafeContext(value: unknown): unknown {
  return project(value, modelContextFields);
}

function toolInputFields(name: AgentToolName | string): Set<string> {
  switch (name) {
    case "prepare_customer_update":
      return new Set(["reason", "draft"]);
    case "prepare_courier_request":
      return new Set(["question"]);
    case "escalate_case":
      return new Set(["reason", "recommendation"]);
    default:
      return new Set();
  }
}

export function toAgentAuditInput(input: {
  kind: AuditStepKind;
  name: string;
  value: unknown;
}): unknown {
  if (input.kind === "model") return toModelSafeContext(input.value);
  if (input.kind === "policy") return project(input.value, policyFields);
  return project(input.value, toolInputFields(input.name));
}

export function toAgentAuditOutput(value: unknown): unknown {
  return project(value, auditOutputFields);
}
