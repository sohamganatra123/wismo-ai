import { afterEach, describe, expect, it, vi } from "vitest";
import { createAgentResponse, parseAgentResponse } from "./openai";

describe("parseAgentResponse", () => {
  it("extracts calls, response id, and usage", () => {
    expect(
      parseAgentResponse({
        id: "resp_1",
        status: "completed",
        output: [
          {
            type: "function_call",
            call_id: "call_1",
            name: "read_case_context",
            arguments: "{}",
          },
        ],
        usage: { input_tokens: 120, output_tokens: 30 },
      }),
    ).toEqual({
      responseId: "resp_1",
      calls: [
        {
          callId: "call_1",
          name: "read_case_context",
          arguments: {},
        },
      ],
      finalText: "",
      inputTokens: 120,
      outputTokens: 30,
    });
  });

  it("rejects unknown tools and invalid arguments", () => {
    expect(() =>
      parseAgentResponse({
        id: "resp_1",
        status: "completed",
        output: [
          {
            type: "function_call",
            call_id: "call_1",
            name: "delete_everything",
            arguments: "{}",
          },
        ],
      }),
    ).toThrow("Unknown agent tool");

    expect(() =>
      parseAgentResponse({
        id: "resp_1",
        status: "completed",
        output: [
          {
            type: "function_call",
            call_id: "call_1",
            name: "read_case_context",
            arguments: "not-json",
          },
        ],
      }),
    ).toThrow("Invalid arguments");
  });

  it("rejects calls that do not match the application-side tool schema", () => {
    expect(() =>
      parseAgentResponse({
        id: "resp_1",
        status: "completed",
        output: [
          {
            type: "function_call",
            call_id: "call_1",
            name: "prepare_courier_request",
            arguments: JSON.stringify({ question: "", token: "not-allowed" }),
          },
        ],
      }),
    ).toThrow("Unexpected argument");
  });

  it("rejects incomplete, refused, empty, and duplicate-call responses", () => {
    expect(() => parseAgentResponse({ id: "resp_1", status: "incomplete", output: [] }))
      .toThrow("not completed");
    expect(() =>
      parseAgentResponse({
        id: "resp_1",
        status: "completed",
        output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }],
      }),
    ).toThrow("refused");
    expect(() =>
      parseAgentResponse({ id: "resp_1", status: "completed", output: [] }),
    ).toThrow("no tool calls or final text");
    expect(() =>
      parseAgentResponse({
        id: "resp_1",
        status: "completed",
        output: [
          { type: "function_call", call_id: "same", name: "read_case_context", arguments: "{}" },
          { type: "function_call", call_id: "same", name: "collect_order_evidence", arguments: "{}" },
        ],
      }),
    ).toThrow("duplicate call IDs");
  });
});

describe("createAgentResponse", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses response continuation items without exposing tool internals", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_MODEL", "test-model");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_2",
          status: "completed",
          output: [
            {
              type: "message",
              content: [{ type: "output_text", text: "Done" }],
            },
          ],
          usage: { input_tokens: 10, output_tokens: 4 },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createAgentResponse({
      previousResponseId: "resp_1",
      toolOutputs: [
        {
          callId: "call_1",
          name: "read_case_context",
          result: { status: "completed", summary: "Context loaded" },
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      model: "test-model",
      previous_response_id: "resp_1",
      input: [
        {
          type: "function_call_output",
          call_id: "call_1",
          output: JSON.stringify({
            name: "read_case_context",
            status: "completed",
            summary: "Context loaded",
          }),
        },
      ],
    });
  });

  it("rejects disallowed or oversized model context before fetch", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_MODEL", "test-model");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createAgentResponse({
        context: {
          caseStatus: "investigating",
          subject: "Where is my order?",
          body: "x".repeat(8_001),
          priorSupportMessages: [],
          token: "never-send",
        },
      } as never),
    ).rejects.toThrow(/disallowed field|exceeds/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
