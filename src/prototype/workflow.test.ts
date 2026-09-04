import { describe, expect, it } from "vitest";
import { parseOrdersCsv, sampleOrdersCsv } from "./orders";
import { decideEmail } from "./workflow";

const now = new Date("2026-09-04T12:00:00Z");
const parsed = parseOrdersCsv(sampleOrdersCsv(now));
if (!parsed.ok) throw new Error("Fixture failed");

describe("prototype email workflow", () => {
  it("remains quiet for unrelated mail", () => {
    expect(decideEmail({ from: "amina@example.com", subject: "Invoice", body: "Please resend it." }, parsed.orders, now.getTime()).kind).toBe("ignore");
  });

  it("asks one question when the order is unclear", () => {
    expect(decideEmail({ from: "leo@example.com", subject: "Delivery", body: "Where is my package?" }, parsed.orders, now.getTime()).kind).toBe("clarify");
  });

  it("responds from one fresh exact order", () => {
    const decision = decideEmail({ from: "amina@example.com", subject: "Order #4921", body: "Where is it?" }, parsed.orders, now.getTime());
    expect(decision.kind).toBe("respond");
    if (decision.kind === "respond") expect(decision.response).toContain("out for delivery");
  });

  it("does not answer from stale data", () => {
    const later = now.getTime() + 25 * 60 * 60 * 1_000;
    expect(decideEmail({ from: "amina@example.com", subject: "Order #4921", body: "Where is it?" }, parsed.orders, later).kind).toBe("clarify");
  });
});
