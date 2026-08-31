import { describe, expect, it } from "vitest";
import { matchCourierReply } from "./courierReply";

const input = {
  configuredEmail: "ops@courier.example",
  senderEmail: "ops@courier.example",
  waitingThreadId: "thread-1",
  replyThreadId: "thread-1",
  orderTrackingNumber: "TRK-123",
  reply: {
    trackingNumber: "TRK-123",
    status: "OUT_FOR_DELIVERY",
    eventTime: "2026-08-31T12:00:00Z",
    location: "Berlin",
  },
};

describe("matchCourierReply", () => {
  it("normalizes an exact safe match", () => {
    expect(matchCourierReply(input)).toEqual({ ok: true, scan: input.reply });
  });

  it.each([
    ["sender", { senderEmail: "other@courier.example" }, "configured courier"],
    ["thread", { replyThreadId: "thread-2" }, "waiting conversation"],
    ["tracking", { reply: { ...input.reply, trackingNumber: "TRK-999" } }, "selected order"],
    ["time", { reply: { ...input.reply, eventTime: "invalid" } }, "event time"],
  ])("rejects a wrong %s", (_label, change, reason) => {
    const result = matchCourierReply({ ...input, ...change });
    expect(result).toEqual({ ok: false, reason: expect.stringContaining(reason) });
  });
});
