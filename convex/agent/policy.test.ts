import { describe, expect, it } from "vitest";
import { evaluateAction, type ActionPolicyInput } from "./policy";

const verified: ActionPolicyInput = {
  mode: "verified",
  proofComplete: true,
  kind: "customer_email",
  exactIdentity: true,
  orderResolved: true,
  exactTracking: true,
  unambiguousScan: true,
  hasConflict: false,
  isCorrection: false,
  alreadyExecuted: false,
  courierConfigured: true,
};

describe("agent action policy", () => {
  it("executes only a fully verified routine customer update", () => {
    expect(evaluateAction(verified)).toBe("execute");
  });

  it.each([
    ["proofComplete", false, "approval"],
    ["orderResolved", false, "approval"],
    ["exactTracking", false, "approval"],
    ["unambiguousScan", false, "approval"],
    ["hasConflict", true, "escalate"],
    ["exactIdentity", false, "escalate"],
    ["alreadyExecuted", true, "escalate"],
    ["isCorrection", true, "approval"],
  ] as const)("handles unsafe %s", (key, value, decision) => {
    expect(evaluateAction({ ...verified, [key]: value })).toBe(decision);
  });

  it("keeps Shopify writes behind approval", () => {
    expect(evaluateAction({ ...verified, kind: "shopify_note" })).toBe("approval");
  });

  it("observes without proposing actions in investigate mode", () => {
    expect(evaluateAction({ ...verified, mode: "investigate" })).toBe("observe");
  });
});
