import { describe, expect, it } from "vitest";
import { manualReplyCapability } from "./manualReplyAccess";

describe("manualReplyCapability", () => {
  it("allows an open case for a founder", () => {
    expect(manualReplyCapability({ role: "founder", caseStatus: "human_attention", hasFounderReply: false })).toEqual({ allowed: true, reason: "available" });
  });

  it("blocks non-founders, closed cases, and duplicate replies", () => {
    expect(manualReplyCapability({ role: "agent", caseStatus: "human_attention", hasFounderReply: false }).allowed).toBe(false);
    expect(manualReplyCapability({ role: "founder", caseStatus: "closed", hasFounderReply: false }).reason).toBe("case_closed");
    expect(manualReplyCapability({ role: "founder", caseStatus: "human_attention", hasFounderReply: true }).reason).toBe("reply_already_sent");
  });
});
