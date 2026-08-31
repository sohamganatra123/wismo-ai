import { describe, expect, it } from "vitest";
import {
  claimableCustomerUpdate,
  customerUpdateDraft,
  customerUpdateHeaders,
} from "./customerUpdate";

const input = {
  caseId: "case-1",
  threadId: "thread-1",
  messageIdHeader: "<message@example.com>",
  recipient: "amina@example.com",
  subject: "Where is order 4921?",
  orderName: "#4921",
  fulfillmentStatus: "IN_TRANSIT",
  orderTrackingNumber: "TRK-123",
  latestTracking: {
    trackingNumber: "TRK-123",
    status: "OUT_FOR_DELIVERY",
    eventTime: "2026-08-31T08:00:00Z",
    location: "Berlin",
  },
};

describe("customerUpdateDraft", () => {
  it("prepares a reply from confirmed selected-order tracking", () => {
    const draft = customerUpdateDraft(input);
    expect(draft.actionKey).toBe("tracking-update:case-1:2026-08-31T08:00:00Z");
    expect(draft.text).toContain("#4921");
    expect(draft.text).toContain("out for delivery");
    expect(draft.text).toContain("Berlin");
    expect(draft.text).toContain("TRK-123");
  });

  it("rejects tracking from another order", () => {
    expect(() => customerUpdateDraft({
      ...input,
      latestTracking: { ...input.latestTracking, trackingNumber: "TRK-999" },
    })).toThrow("Tracking number does not match the selected order");
  });

  it("creates safe Gmail reply headers", () => {
    const headers = customerUpdateHeaders(customerUpdateDraft(input));
    expect(headers).toContain("In-Reply-To: <message@example.com>");
    expect(headers.join("\n")).not.toContain("\r");
  });
});

describe("claimableCustomerUpdate", () => {
  it("claims one pending update and rejects a second attempt", () => {
    const payload = customerUpdateDraft(input);
    expect(claimableCustomerUpdate({ kind: "customer_email", status: "pending", payload })).toEqual(payload);
    expect(() => claimableCustomerUpdate({ kind: "customer_email", status: "completed", payload }))
      .toThrow("already handled");
  });
});
