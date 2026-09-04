import { describe, expect, it } from "vitest";
import { validateApprovalReuse, validateToolReplay } from "./approvalReuse";

describe("approval action-key reuse", () => {
  const existing = {
    caseId: "case-1",
    kind: "customer_email",
    payload: { actionKey: "identity:case-1", text: "Which order?" },
    status: "pending" as const,
  };

  it("reuses only the exact same case, kind, and payload", () => {
    expect(validateApprovalReuse(existing, existing)).toBe("pending");
    expect(() =>
      validateApprovalReuse(existing, { ...existing, caseId: "case-2" }),
    ).toThrow("different case");
    expect(() =>
      validateApprovalReuse(existing, {
        ...existing,
        payload: { actionKey: "identity:case-1", text: "Changed" },
      }),
    ).toThrow("payload");
  });

  it.each(["rejected", "failed", "completed"] as const)(
    "preserves the existing %s state",
    (status) => {
      expect(validateApprovalReuse({ ...existing, status }, existing)).toBe(status);
    },
  );
});

describe("tool replay receipts", () => {
  it("reuses a result only for the same named call", () => {
    const receipt = { name: "read_case_context", result: { status: "completed" } };
    expect(validateToolReplay(receipt, "read_case_context")).toEqual({ status: "completed" });
    expect(() => validateToolReplay(receipt, "prepare_customer_update")).toThrow(
      "does not match",
    );
  });
});
