import { agentToolNames, type AgentToolName } from "./contracts";

type StringProperty = {
  type: "string";
  description: string;
};

export type AgentToolDefinition = {
  type: "function";
  name: AgentToolName;
  description: string;
  strict: true;
  parameters: {
    type: "object";
    properties: Record<string, StringProperty>;
    required: string[];
    additionalProperties: false;
  };
};

function tool(
  name: AgentToolName,
  description: string,
  properties: Record<string, StringProperty> = {},
): AgentToolDefinition {
  return {
    type: "function",
    name,
    description,
    strict: true,
    parameters: {
      type: "object",
      properties,
      required: Object.keys(properties),
      additionalProperties: false,
    },
  };
}

export const agentTools: AgentToolDefinition[] = [
  tool(
    "read_case_context",
    "Read the current case, customer message, and safe run context.",
  ),
  tool(
    "match_shopify_customer",
    "Match the customer to Shopify using the sender identity fixed by the run.",
  ),
  tool(
    "select_only_order",
    "Select the order when exactly one is eligible, or safely prepare customer choices when several are eligible.",
  ),
  tool(
    "collect_order_evidence",
    "Collect stored order, message, fulfillment, and tracking evidence.",
  ),
  tool("prepare_customer_update", "Prepare a customer update for a later policy check.", {
    reason: {
      type: "string",
      description: "Why this update follows from the collected evidence.",
    },
    draft: {
      type: "string",
      description: "The proposed customer-facing email body.",
    },
  }),
  tool(
    "prepare_identity_request",
    "Prepare a request for the customer information needed to establish identity.",
  ),
  tool("prepare_courier_request", "Prepare a bounded question for the configured courier.", {
    question: {
      type: "string",
      description: "The operational question to ask about the fixed tracking number.",
    },
  }),
  tool("escalate_case", "Stop automatic progress and recommend a human next step.", {
    reason: {
      type: "string",
      description: "The evidence-based reason the case cannot continue safely.",
    },
    recommendation: {
      type: "string",
      description: "The concrete next step recommended to a human operator.",
    },
  }),
];

export function isAgentToolName(value: string): value is AgentToolName {
  return (agentToolNames as readonly string[]).includes(value);
}

export function validateAgentToolArguments(
  name: AgentToolName,
  value: unknown,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid arguments for agent tool: ${name}`);
  }

  const definition = agentTools.find((candidate) => candidate.name === name);
  if (!definition) throw new Error(`Unknown agent tool: ${name}`);
  const argumentsRecord = value as Record<string, unknown>;
  const declaredKeys = Object.keys(definition.parameters.properties);
  const receivedKeys = Object.keys(argumentsRecord);

  if (receivedKeys.some((key) => !declaredKeys.includes(key))) {
    throw new Error(`Unexpected argument for agent tool: ${name}`);
  }

  for (const key of definition.parameters.required) {
    const argument = argumentsRecord[key];
    if (typeof argument !== "string" || argument.trim().length === 0) {
      throw new Error(`Missing required argument for agent tool: ${name}.${key}`);
    }
    const maximum = key === "draft" ? 8_000 : 2_000;
    if (argument.length > maximum) {
      throw new Error(`Agent tool argument exceeds ${maximum} characters: ${name}.${key}`);
    }
  }

  return argumentsRecord;
}
