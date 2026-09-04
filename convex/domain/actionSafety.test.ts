import { describe, expect, it } from "vitest";
import { verifiedCustomerAction } from "./actionSafety";

const safe = {
  exactIdentity: true,
  orderResolved: true,
  orderTrackingNumber: "TRACK-1",
  scanTrackingNumber: "TRACK-1",
  scanIsNewest: true,
  hasConflict: false,
  isCorrection: false,
  proofComplete: true,
  alreadyExecuted: false,
};

describe("verified customer action", () => {
  it("allows an exact, current, proof-backed action", () => {
    expect(verifiedCustomerAction(safe)).toEqual({ allowed: true });
  });

  it("returns every failed predicate", () => {
    expect(verifiedCustomerAction({
      ...safe,
      orderTrackingNumber: "TRACK-1",
      scanTrackingNumber: "TRACK-2",
      scanIsNewest: false,
      hasConflict: true,
    })).toEqual({
      allowed: false,
      reasons: ["tracking_number_mismatch", "tracking_scan_stale", "tracking_conflict"],
    });
  });
});
