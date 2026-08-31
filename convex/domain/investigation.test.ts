import { describe, expect, it } from "vitest";
import { collectInvestigationEvidence } from "./investigation";

const order = {
  id: "order-1",
  name: "#4921",
  createdAt: "2026-08-28T10:00:00Z",
  lineItems: ["Canvas backpack"],
  fulfillmentStatus: "IN_TRANSIT",
  trackingNumber: "TRK-123",
  trackingUrl: "https://track.example/TRK-123",
};

describe("collectInvestigationEvidence", () => {
  it("collects previous messages and the newest exact-match tracking scan", () => {
    const evidence = collectInvestigationEvidence({
      order,
      previousMessages: [
        { id: "old", subject: "Order", text: "Has it shipped?", sentAt: 10 },
        { id: "new", subject: "Order", text: "Any update?", sentAt: 20 },
      ],
      scans: [
        { trackingNumber: "TRK-123", status: "in_transit", eventTime: "2026-08-30T09:00:00Z" },
        { trackingNumber: "TRK-999", status: "delivered", eventTime: "2026-08-31T12:00:00Z" },
        { trackingNumber: "TRK-123", status: "out_for_delivery", eventTime: "2026-08-31T08:00:00Z", location: "Berlin" },
      ],
    });

    expect(evidence.previousMessages.map((message) => message.id)).toEqual(["new", "old"]);
    expect(evidence.order.fulfillmentStatus).toBe("IN_TRANSIT");
    expect(evidence.latestTracking).toMatchObject({
      trackingNumber: "TRK-123",
      status: "out_for_delivery",
      location: "Berlin",
    });
  });

  it("returns no update when a matching scan has an invalid event time", () => {
    const evidence = collectInvestigationEvidence({
      order,
      previousMessages: [],
      scans: [
        { trackingNumber: "TRK-123", status: "in_transit", eventTime: "not-a-date" },
        { trackingNumber: "TRK-123", status: "label_created", eventTime: "2026-08-29T08:00:00Z" },
      ],
    });

    expect(evidence.latestTracking).toBeNull();
  });

  it("requires a selected order", () => {
    expect(() => collectInvestigationEvidence({ order: null, previousMessages: [], scans: [] }))
      .toThrow("A selected order is required");
  });
});
