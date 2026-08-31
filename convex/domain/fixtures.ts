export const caseFixtures = {
  matched: { sender: "amina@example.com", orderTrackingNumber: "TRK-123" },
  unknown: { sender: "unknown@example.com", orderTrackingNumber: null },
  ambiguous: { sender: "amina@example.com", candidateOrders: ["#4921", "#4934"] },
  conflicting: { orderTrackingNumber: "TRK-123", courierTrackingNumber: "TRK-999" },
  delivered: { orderTrackingNumber: "TRK-123", newestStatus: "delivered" },
  missingAfterDelivery: { priorStatus: "closed", message: "My parcel says delivered but is missing." },
  integrationFailure: { provider: "shopify", statusCode: 503 },
} as const;
