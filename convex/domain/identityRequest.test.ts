import { describe, expect, it } from "vitest";
import {
  claimableIdentityRequest,
  identityRequestDraft,
  identityRequestHeaders,
  isIdentityRequestPayload,
} from "./identityRequest";

describe("identityRequestDraft", () => {
  const input = {
    caseId: "case-123",
    threadId: "thread-456",
    recipient: "customer@example.com",
    subject: "Where is my order?",
  };

  it("asks only for the checkout email and order number", () => {
    const draft = identityRequestDraft(input);

    expect(draft.text).toContain("checkout email");
    expect(draft.text).toContain("order number");
    expect(draft.text).not.toMatch(/tracking|address|product/i);
    expect(draft.to).toBe("customer@example.com");
  });

  it("creates a safe reply subject", () => {
    expect(identityRequestDraft(input).subject).toBe("Re: Where is my order?");
    expect(
      identityRequestDraft({ ...input, subject: "Re: Existing\r\nBcc: bad@example.com" })
        .subject,
    ).toBe("Re: Existing Bcc: bad@example.com");
  });

  it("returns the same action key for repeated input", () => {
    const first = identityRequestDraft(input);
    const second = identityRequestDraft(input);

    expect(first.actionKey).toBe("identity-request:case-123:thread-456");
    expect(second.actionKey).toBe(first.actionKey);
  });

  it("keeps a reply in the original Gmail conversation safely", () => {
    const draft = identityRequestDraft({
      ...input,
      messageIdHeader: "<original@example.com>",
    });

    expect(identityRequestHeaders(draft)).toContain(
      "In-Reply-To: <original@example.com>",
    );
    expect(identityRequestHeaders(draft)).toContain(
      "References: <original@example.com>",
    );

    const injected = { ...draft, messageIdHeader: "<original@example.com>\r\nBcc: bad@example.com" };
    expect(identityRequestHeaders(injected).join("\n")).not.toContain("Bcc:");
  });

  it("accepts only complete identity-request payloads", () => {
    const draft = identityRequestDraft(input);

    expect(isIdentityRequestPayload(draft)).toBe(true);
    expect(isIdentityRequestPayload({ ...draft, actionKey: "tracking-update:1" })).toBe(false);
    expect(isIdentityRequestPayload({ ...draft, text: undefined })).toBe(false);
  });

  it("allows one pending customer-email approval to execute", () => {
    const draft = identityRequestDraft(input);

    expect(
      claimableIdentityRequest({ kind: "customer_email", status: "pending", payload: draft }),
    ).toEqual(draft);
    expect(() =>
      claimableIdentityRequest({ kind: "shopify_update", status: "pending", payload: draft }),
    ).toThrow("not found");
    expect(() =>
      claimableIdentityRequest({ kind: "customer_email", status: "completed", payload: draft }),
    ).toThrow("already handled");
    expect(() =>
      claimableIdentityRequest({ kind: "customer_email", status: "pending", payload: {} }),
    ).toThrow("Invalid");
  });
});
