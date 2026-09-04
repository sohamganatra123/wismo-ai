import { describe, expect, it } from "vitest";
import {
  toAgentAuditInput,
  toAgentAuditOutput,
  toModelSafeContext,
  redactSensitiveText,
} from "./redaction";

describe("agent data projection", () => {
  it("removes phone, street address, credentials, and signatures from model text", () => {
    expect(
      redactSensitiveText(
        "Call +49 170 1234567\nShip to Private Street 1\npassword: hunter2\nRegards,\nAmina",
      ),
    ).toBe("Call [phone removed]\n[street address removed]\n[credential removed]\n[signature removed]");
  });
  it("keeps only explicitly allowed model context", () => {
    expect(
      toModelSafeContext({
        caseStatus: "investigating",
        trackingNumber: "TRACK-1",
        accessToken: "never-store-this",
        phone: "+49 123",
        shippingAddress: "Private street 1",
        nested: { secret: "hidden" },
      }),
    ).toEqual({
      caseStatus: "investigating",
      trackingNumber: "TRACK-1",
    });
  });

  it("projects tool arguments according to the named strict tool", () => {
    expect(
      toAgentAuditInput({
        kind: "tool",
        name: "prepare_customer_update",
        value: {
          reason: "The newest scan is clear",
          draft: "Your parcel is moving.",
          authorization: "never-store-this",
        },
      }),
    ).toEqual({
      reason: "The newest scan is clear",
      draft: "Your parcel is moving.",
    });
  });

  it("does not pass arbitrary tool output into audit or continuation state", () => {
    expect(
      toAgentAuditOutput({
        ok: true,
        orderName: "#1001",
        encryptedCredentials: "never-store-this",
      }),
    ).toEqual({ ok: true, orderName: "#1001" });
  });
});
