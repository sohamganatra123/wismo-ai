import type {
  AgentModelContext,
  AgentResponse,
  AgentSafeToolOutput,
  AgentToolCall,
} from "./contracts";
import {
  agentTools,
  isAgentToolName,
  validateAgentToolArguments,
} from "./toolSchemas";
import {
  assertAgentModelContext,
  assertAgentSafeToolOutputs,
} from "./privacy";

export type CreateAgentResponseInput =
  | { context: AgentModelContext; previousResponseId?: never; toolOutputs?: never }
  | { context?: never; previousResponseId: string; toolOutputs: AgentSafeToolOutput[] };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function tokenCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

const agentInstructions = [
  "You resolve delivery-status questions using only the supplied tools.",
  "Use only evidence in the bounded case context.",
  "Always inspect case context and Shopify matching before recommending an action.",
  "With no exact customer match, prepare an identity request.",
  "When Shopify returns multiple candidate orders, call select_only_order; it will safely prepare the customer selection request without guessing.",
  "With one order, select it and collect evidence before proposing an update.",
  "If Shopify failed or evidence conflicts, escalate instead of guessing.",
  "Propose actions; application policy controls every external effect.",
  "Escalate when identity, order, tracking, or evidence is ambiguous or conflicting.",
].join(" ");

const maximumFinalTextLength = 4_000;

export function buildAgentContinuationInput(outputs: AgentSafeToolOutput[]) {
  return assertAgentSafeToolOutputs(outputs).map((result) => ({
    type: "function_call_output" as const,
    call_id: result.callId,
    output: JSON.stringify({ name: result.name, ...result.result }),
  }));
}

function parseToolCall(item: UnknownRecord): AgentToolCall {
  const callId = item.call_id;
  const name = item.name;
  const rawArguments = item.arguments;

  if (typeof callId !== "string" || callId.length === 0) {
    throw new Error("Agent tool call is missing a call ID");
  }
  if (typeof name !== "string" || !isAgentToolName(name)) {
    throw new Error(`Unknown agent tool: ${String(name)}`);
  }
  if (typeof rawArguments !== "string") {
    throw new Error(`Invalid arguments for agent tool: ${name}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawArguments);
  } catch {
    throw new Error(`Invalid arguments for agent tool: ${name}`);
  }
  return {
    callId,
    name,
    arguments: validateAgentToolArguments(name, parsed),
  };
}

export function parseAgentResponse(payload: unknown): AgentResponse {
  if (!isRecord(payload) || typeof payload.id !== "string" || payload.id.length === 0) {
    throw new Error("OpenAI response is missing an ID");
  }
  if (payload.status !== "completed") {
    throw new Error(`OpenAI response was not completed: ${String(payload.status)}`);
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const calls: AgentToolCall[] = [];
  const textParts: string[] = [];

  for (const item of output) {
    if (!isRecord(item)) continue;
    if (item.type === "function_call") {
      calls.push(parseToolCall(item));
      continue;
    }
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (isRecord(content) && content.type === "refusal") {
        throw new Error("OpenAI response was refused");
      }
      if (
        isRecord(content) &&
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        textParts.push(content.text);
      }
    }
  }

  const callIds = calls.map((call) => call.callId);
  if (new Set(callIds).size !== callIds.length) {
    throw new Error("OpenAI response contains duplicate call IDs");
  }
  const finalText = textParts.join("\n").trim();
  if (calls.length === 0 && finalText.length === 0) {
    throw new Error("OpenAI response contained no tool calls or final text");
  }
  if (finalText.length > maximumFinalTextLength) {
    throw new Error("OpenAI final text exceeds the allowed length");
  }

  const usage = isRecord(payload.usage) ? payload.usage : {};
  return {
    responseId: payload.id,
    calls,
    finalText,
    inputTokens: tokenCount(usage.input_tokens),
    outputTokens: tokenCount(usage.output_tokens),
  };
}

export async function createAgentResponse(
  input: CreateAgentResponseInput,
): Promise<AgentResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required");
  if (!model) throw new Error("OPENAI_MODEL is required");

  const rawInput = input as unknown;
  if (rawInput === null || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    throw new Error("Agent response input must be a typed object");
  }
  const fields = Object.keys(rawInput as Record<string, unknown>);
  const isInitial = "context" in input;
  const allowedFields = isInitial
    ? new Set(["context"])
    : new Set(["previousResponseId", "toolOutputs"]);
  const extra = fields.find((field) => !allowedFields.has(field));
  if (extra) throw new Error(`Agent response input contains disallowed field: ${extra}`);

  let requestInput: string | Array<Record<string, string>>;
  let previousResponseId: string | undefined;
  if (isInitial) {
    if (input.context === undefined) throw new Error("Agent model context is required");
    requestInput = JSON.stringify(assertAgentModelContext(input.context));
  } else {
    if (
      typeof input.previousResponseId !== "string" ||
      input.previousResponseId.length === 0 ||
      input.previousResponseId.length > 200
    ) {
      throw new Error("previousResponseId is invalid");
    }
    previousResponseId = input.previousResponseId;
    requestInput = buildAgentContinuationInput(input.toolOutputs);
  }
  const requestBody: Record<string, unknown> = {
    model,
    tools: agentTools,
    instructions: agentInstructions,
    input: requestInput,
  };
  if (previousResponseId) {
    requestBody.previous_response_id = previousResponseId;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  return parseAgentResponse(await response.json());
}
