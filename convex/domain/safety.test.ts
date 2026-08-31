import { describe, expect, it } from "vitest";
import {
  chooseNewestMatchingScan,
  hasExactTrackingMatch,
  type TrackingScan,
} from "./tracking";
import { canExecuteExternalAction, createActionKey } from "./approvals";
import { courierRetryPolicy, nextRetryAt, shopifyRetryPolicy } from "./retries";
import { canTransitionCase } from "./stateMachine";

describe("tracking safety", () => {
  const scans: TrackingScan[] = [
    { trackingNumber: "TRK-123", status: "out_for_delivery", eventTime: "2026-08-31T09:00:00Z" },
    { trackingNumber: "TRK-123", status: "delivery_failed", eventTime: "2026-08-31T11:00:00Z" },
  ];

  it("requires an exact, case-sensitive tracking-number match", () => {
    expect(hasExactTrackingMatch("TRK-123", "TRK-123")).toBe(true);
    expect(hasExactTrackingMatch("TRK-123", "TRK-124")).toBe(false);
    expect(hasExactTrackingMatch("TRK-123", "trk-123")).toBe(false);
    expect(hasExactTrackingMatch("TRK-123", " TRK-123 ")).toBe(false);
  });

  it("uses the newest matching scan by recorded event time", () => {
    expect(chooseNewestMatchingScan("TRK-123", scans)?.status).toBe("delivery_failed");
  });

  it("rejects scans belonging to another order", () => {
    expect(chooseNewestMatchingScan("TRK-999", scans)).toBeNull();
  });

  it("rejects a matching scan with an invalid event time", () => {
    expect(chooseNewestMatchingScan("TRK-123", [
      ...scans,
      { trackingNumber: "TRK-123", status: "delivered", eventTime: "not-a-date" },
    ])).toBeNull();
  });
});

describe("external action approval", () => {
  it.each(["customer_email", "courier_email", "shopify_note", "shopify_tracking"] as const)(
    "blocks %s without an approved action",
    (kind) => expect(canExecuteExternalAction({ kind, approvalStatus: "pending", alreadyExecuted: false })).toBe(false),
  );

  it("allows an approved action once", () => {
    expect(canExecuteExternalAction({ kind: "customer_email", approvalStatus: "approved", alreadyExecuted: false })).toBe(true);
    expect(canExecuteExternalAction({ kind: "customer_email", approvalStatus: "approved", alreadyExecuted: true })).toBe(false);
  });

  it("creates one stable key for the same case action revision", () => {
    expect(createActionKey("case-1", "customer_email", 1)).toBe("case-1:customer_email:1");
    expect(createActionKey("case-1", "customer_email", 1)).toBe(createActionKey("case-1", "customer_email", 1));
    expect(createActionKey("case-1", "customer_email", 2)).not.toBe(createActionKey("case-1", "customer_email", 1));
  });
});

describe("retry limits", () => {
  it("allows three courier attempts three hours apart", () => {
    expect(courierRetryPolicy).toEqual({ maxAttempts: 3, delayMs: 3 * 60 * 60 * 1000 });
  });

  it("allows three Shopify attempts five minutes apart", () => {
    expect(shopifyRetryPolicy).toEqual({ maxAttempts: 3, delayMs: 5 * 60 * 1000 });
  });

  it("returns no next retry after the maximum attempt count", () => {
    expect(nextRetryAt(courierRetryPolicy, 2, 1_000)).toBe(1_000 + courierRetryPolicy.delayMs);
    expect(nextRetryAt(courierRetryPolicy, 3, 1_000)).toBeNull();
  });
});

describe("case transitions", () => {
  it("closes only from confirmed delivery", () => {
    expect(canTransitionCase("investigating", "closed")).toBe(false);
    expect(canTransitionCase("delivery_confirmed", "closed")).toBe(true);
  });

  it("reopens a closed missing-package case into human attention", () => {
    expect(canTransitionCase("closed", "human_attention")).toBe(true);
  });
});
