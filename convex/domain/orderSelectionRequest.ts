export type OrderSelectionCandidate = {
  createdAt: string;
  lineItems: string[];
};

export type OrderSelectionRequestPayload = {
  actionKey: string;
  threadId: string;
  messageIdHeader?: string;
  to: string;
  subject: string;
  text: string;
};

function safeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "date unavailable" : date.toISOString().slice(0, 10);
}

function safeProduct(value: string) {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[private detail]")
    .replace(/(?:\+?\d[\d ().-]{7,}\d)/g, "[private detail]")
    .replace(/^.*\b(?:street|st\.?|road|rd\.?|avenue|ave\.?|lane|ln\.?|strasse|straße)\b.*$/gi, "[private detail]")
    .trim()
    .slice(0, 120) || "Product";
}

export function orderSelectionRequestDraft(input: {
  caseId: string;
  threadId: string;
  messageIdHeader?: string;
  recipient: string;
  subject: string;
  candidates: OrderSelectionCandidate[];
}): OrderSelectionRequestPayload {
  if (input.candidates.length < 2 || input.candidates.length > 10) {
    throw new Error("Order selection requires between 2 and 10 safe candidates");
  }
  const handles = input.candidates.map((candidate, index) => {
    const products = candidate.lineItems.slice(0, 5).map(safeProduct).join(", ") || "Product";
    return `${index + 1}. Ordered ${safeDate(candidate.createdAt)} — ${products}`;
  });
  return {
    actionKey: `order-selection:${input.caseId}:${input.threadId}`,
    threadId: input.threadId,
    ...(input.messageIdHeader
      ? { messageIdHeader: input.messageIdHeader.replace(/[\r\n]+/g, "").trim() }
      : {}),
    to: input.recipient,
    subject: "Re: Which delivery?",
    text: `Hi,\n\nI found more than one active order. Please reply with the matching option:\n\n${handles.join("\n")}\n\nWISMO`,
  };
}

export function isOrderSelectionRequestPayload(
  value: unknown,
): value is OrderSelectionRequestPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.actionKey === "string" &&
    item.actionKey.startsWith("order-selection:") &&
    typeof item.threadId === "string" &&
    (item.messageIdHeader === undefined || typeof item.messageIdHeader === "string") &&
    typeof item.to === "string" &&
    typeof item.subject === "string" &&
    typeof item.text === "string"
  );
}
