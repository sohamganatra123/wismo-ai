export type InboxMessage = {
  id: string;
  direction: "inbound" | "outbound";
  party: "customer" | "courier" | "support";
  kind: "customer" | "agent_clarification" | "agent_reply" | "founder_reply";
  from: string;
  to: string[];
  subject: string;
  text: string;
  sentAt: number;
  deliveryStatus: string | null;
};

type CaseWithOptionalMessages = {
  id: string;
  createdAt: number;
  from: string;
  subject: string;
  text: string;
  messages?: InboxMessage[];
};

export function messagesForCase(item: CaseWithOptionalMessages): InboxMessage[] {
  if (Array.isArray(item.messages) && item.messages.length > 0) return item.messages;

  return [{
    id: `source-${item.id}`,
    direction: "inbound",
    party: "customer",
    kind: "customer",
    from: item.from,
    to: [],
    subject: item.subject,
    text: item.text,
    sentAt: item.createdAt,
    deliveryStatus: null,
  }];
}

export function conversationForCase(item: CaseWithOptionalMessages) {
  const complete = Array.isArray(item.messages) && item.messages.length > 0;
  return {
    completeness: complete ? ("complete" as const) : ("source_only" as const),
    messages: messagesForCase(item),
  };
}
