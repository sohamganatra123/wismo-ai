import { describe, expect, it } from "vitest";
import { conversationForCase, messagesForCase, type InboxMessage } from "./liveCaseCompatibility";

const legacyCase = {
  id: "case-1",
  createdAt: 1_725_466_400_000,
  from: "Amina <amina@example.com>",
  subject: "Where is my order?",
  text: "Can you check the tracking?",
};

describe("messagesForCase", () => {
  it("keeps the inbox usable while an older backend response has no messages field", () => {
    expect(messagesForCase(legacyCase)).toEqual([{
      id: "source-case-1",
      direction: "inbound",
      party: "customer",
      kind: "customer",
      from: legacyCase.from,
      to: [],
      subject: legacyCase.subject,
      text: legacyCase.text,
      sentAt: legacyCase.createdAt,
      deliveryStatus: null,
    }]);
  });

  it("uses the full thread returned by the newer backend", () => {
    const messages: InboxMessage[] = [{
      id: "message-1",
      direction: "outbound",
      party: "support",
      kind: "founder_reply",
      from: "founder@example.com",
      to: ["amina@example.com"],
      subject: "Re: Where is my order?",
      text: "I am checking this now.",
      sentAt: legacyCase.createdAt + 1_000,
      deliveryStatus: "sent",
    }];

    expect(messagesForCase({ ...legacyCase, messages })).toBe(messages);
  });

  it("marks a legacy response as source-only instead of implying delivery", () => {
    expect(conversationForCase(legacyCase).completeness).toBe("source_only");
  });
});
