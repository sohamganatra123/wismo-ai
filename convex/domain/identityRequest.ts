export type IdentityRequestInput = {
  caseId: string;
  threadId: string;
  messageIdHeader?: string;
  recipient: string;
  subject: string;
};

export type IdentityRequestPayload = {
  actionKey: string;
  threadId: string;
  messageIdHeader?: string;
  to: string;
  subject: string;
  text: string;
};

type IdentityRequestApproval = {
  kind: string;
  status: string;
  payload: unknown;
};

export const IDENTITY_REQUEST_TEXT = `Hi,

I can help with your delivery question. To find the right order safely, please reply with your checkout email and order number.

WISMO`;

function replySubject(subject: string) {
  const safe = subject.replace(/[\r\n]+/g, " ").trim();
  if (!safe || safe === "(no subject)") return "Re: Delivery question";
  return /^re:/i.test(safe) ? safe : `Re: ${safe}`;
}

export function identityRequestDraft(input: IdentityRequestInput) {
  return {
    actionKey: `identity-request:${input.caseId}:${input.threadId}`,
    threadId: input.threadId,
    ...(input.messageIdHeader
      ? { messageIdHeader: input.messageIdHeader.replace(/[\r\n]+/g, "").trim() }
      : {}),
    to: input.recipient,
    subject: replySubject(input.subject),
    text: IDENTITY_REQUEST_TEXT,
  };
}

export function isIdentityRequestPayload(value: unknown): value is IdentityRequestPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.actionKey === "string" &&
    item.actionKey.startsWith("identity-request:") &&
    typeof item.threadId === "string" &&
    (item.messageIdHeader === undefined || typeof item.messageIdHeader === "string") &&
    typeof item.to === "string" &&
    typeof item.subject === "string" &&
    typeof item.text === "string"
  );
}

export function identityRequestHeaders(payload: IdentityRequestPayload) {
  const candidate = payload.messageIdHeader?.trim();
  const reference = candidate && /^<[^<>\s]+>$/.test(candidate) ? candidate : undefined;
  return [
    `To: ${payload.to}`,
    `Subject: ${payload.subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    ...(reference
      ? [`In-Reply-To: ${reference}`, `References: ${reference}`]
      : []),
  ];
}

export function claimableIdentityRequest(
  approval: IdentityRequestApproval | null,
): IdentityRequestPayload {
  if (!approval || approval.kind !== "customer_email") {
    throw new Error("Identity request approval not found");
  }
  if (approval.status !== "pending") {
    throw new Error("This identity request was already handled");
  }
  if (!isIdentityRequestPayload(approval.payload)) {
    throw new Error("Invalid identity request payload");
  }
  return approval.payload;
}
