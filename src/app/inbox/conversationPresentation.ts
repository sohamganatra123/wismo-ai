import type { InboxMessage } from "./liveCaseCompatibility";

export function hasSentClarification(messages: InboxMessage[]) {
  return messages.some(
    (message) =>
      message.kind === "agent_clarification" && message.deliveryStatus === "sent",
  );
}

export function caseStateLabel(status: string, messages: InboxMessage[]) {
  if (status === "order_needed") {
    return hasSentClarification(messages) ? "Clarification sent" : "Clarification needed";
  }
  if (status === "human_attention") return "Founder reply needed";
  return null;
}
