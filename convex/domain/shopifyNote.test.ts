import { describe, expect, it } from "vitest";
import { claimableShopifyNote, shopifyNotePayload } from "./shopifyNote";

describe("shopify note approval", () => {
  it("creates a stable safe note", () => {
    const payload = shopifyNotePayload({ caseId: "case-1", orderId: "gid://shopify/Order/1", trackingNumber: "TRK-123", status: "OUT_FOR_DELIVERY", eventTime: "2026-08-31T12:00:00Z" });
    expect(payload.actionKey).toBe("courier-note:case-1:2026-08-31T12:00:00Z");
    expect(payload.note).toContain("TRK-123");
  });

  it("rejects a handled approval", () => {
    const payload = shopifyNotePayload({ caseId: "case-1", orderId: "gid://shopify/Order/1", trackingNumber: "TRK-123", status: "IN_TRANSIT", eventTime: "2026-08-31T12:00:00Z" });
    expect(() => claimableShopifyNote({ kind: "shopify_note", status: "completed", payload })).toThrow("already handled");
  });
});
