import { describe, expect, it } from "vitest";
import { orderSelectionRequestDraft } from "./orderSelectionRequest";

describe("order selection request", () => {
  it("lists only bounded dates and product descriptions", () => {
    const draft = orderSelectionRequestDraft({
      caseId: "case-1",
      threadId: "thread-1",
      recipient: "customer@example.com",
      subject: "Where is my order?",
      candidates: [
        { createdAt: "2026-08-28T10:00:00Z", lineItems: ["Canvas backpack"] },
        { createdAt: "2026-08-30T10:00:00Z", lineItems: ["Travel pouch +49 170 1234567"] },
      ],
    });

    expect(draft.actionKey).toBe("order-selection:case-1:thread-1");
    expect(draft.text).toContain("1. Ordered 2026-08-28 — Canvas backpack");
    expect(draft.text).toContain("2. Ordered 2026-08-30 — Travel pouch [private detail]");
    expect(draft.text).not.toContain("1234567");
    expect(draft.text).not.toContain("tracking");
  });

  it("requires an ambiguous bounded candidate set", () => {
    expect(() =>
      orderSelectionRequestDraft({
        caseId: "case-1",
        threadId: "thread-1",
        recipient: "customer@example.com",
        subject: "Order",
        candidates: [{ createdAt: "2026-08-28", lineItems: ["Bag"] }],
      }),
    ).toThrow("between 2 and 10");
  });
});
