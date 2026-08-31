import { describe, expect, it } from "vitest";
import { classifyInboundEmail } from "./inboundClassification";

describe("inbound email classification", () => {
  it.each([
    ["Where is order 4921?", "Can you send me the latest tracking update?"],
    ["Delivery question", "My package has not arrived."],
    ["WISMO", "When will my parcel get here?"],
  ])("accepts a clear WISMO request", (subject, text) => {
    expect(classifyInboundEmail({ subject, text })).toBe("wismo");
  });

  it.each([
    ["", ""],
    ["Order #4921", "Help"],
    ["Delivery", "Hello"],
  ])(
    "asks for clarification when a likely request is unclear",
    (subject, text) => {
      expect(classifyInboundEmail({ subject, text })).toBe("clarification");
    },
  );

  it.each([
    ["Summer sale", "Get 20% off today"],
    ["Invoice attached", "Please pay by Friday"],
    ["Team lunch", "Can we move this to noon?"],
  ])("rejects unrelated mail", (subject, text) => {
    expect(classifyInboundEmail({ subject, text })).toBe("unrelated");
  });
});
