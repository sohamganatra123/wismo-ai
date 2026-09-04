import { describe, expect, it } from "vitest";
import { founderReplyDraft, founderReplyHeaders } from "./founderReply";

const input = {
  caseId: "case-123",
  threadId: "thread-456",
  messageIdHeader: "<customer-message@example.com>",
  recipient: "customer@example.com",
  subject: "Where is order 4921?",
  text: "  Hi Amina,\n\nI am checking this personally.  ",
  requestId: "reply_12345678",
};

describe("founderReplyDraft", () => {
  it("creates a stable reply payload in the original thread", () => {
    expect(founderReplyDraft(input)).toEqual({
      actionKey: "founder-reply:case-123:reply_12345678",
      threadId: "thread-456",
      messageIdHeader: "<customer-message@example.com>",
      to: "customer@example.com",
      subject: "Re: Where is order 4921?",
      text: "Hi Amina,\n\nI am checking this personally.",
    });
  });

  it("rejects blank and oversized replies", () => {
    expect(() => founderReplyDraft({ ...input, text: "   " })).toThrow("Reply is required");
    expect(() => founderReplyDraft({ ...input, text: "x".repeat(4_001) })).toThrow(
      "Reply must be 4,000 characters or fewer",
    );
  });

  it("rejects unsafe request IDs and recipients", () => {
    expect(() => founderReplyDraft({ ...input, requestId: "bad:id" })).toThrow(
      "Reply request ID is invalid",
    );
    expect(() => founderReplyDraft({ ...input, recipient: "not-an-email" })).toThrow(
      "Customer email is invalid",
    );
  });

  it("removes header injection from subjects and references", () => {
    const draft = founderReplyDraft({
      ...input,
      subject: "Existing reply\r\nBcc: bad@example.com",
      messageIdHeader: "<safe@example.com>\r\nBcc: bad@example.com",
    });

    expect(draft.subject).toBe("Re: Existing reply Bcc: bad@example.com");
    expect(draft.messageIdHeader).toBeUndefined();
    expect(founderReplyHeaders(draft).join("\n")).not.toContain("\r");
  });

  it("adds safe Gmail reply headers", () => {
    const headers = founderReplyHeaders(founderReplyDraft(input));

    expect(headers).toContain("In-Reply-To: <customer-message@example.com>");
    expect(headers).toContain("References: <customer-message@example.com>");
    expect(headers).toContain("To: customer@example.com");
  });
});
