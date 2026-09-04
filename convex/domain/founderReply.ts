export type FounderReplyPayload = {
  actionKey: string;
  threadId: string;
  messageIdHeader?: string;
  to: string;
  subject: string;
  text: string;
};

const requestIdPattern = /^[A-Za-z0-9_-]{8,100}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeSubject(subject: string) {
  const value = subject.replace(/[\r\n]+/g, " ").trim();
  if (!value || value === "(no subject)") return "Re: Delivery question";
  return /^re:/i.test(value) ? value : `Re: ${value}`;
}

export function founderReplyDraft(input: {
  caseId: string;
  threadId: string;
  messageIdHeader?: string;
  recipient: string;
  subject: string;
  text: string;
  requestId: string;
}): FounderReplyPayload {
  const text = input.text.trim();
  if (!text) throw new Error("Reply is required");
  if (text.length > 4_000) throw new Error("Reply must be 4,000 characters or fewer");
  if (!requestIdPattern.test(input.requestId)) throw new Error("Reply request ID is invalid");
  if (!emailPattern.test(input.recipient)) throw new Error("Customer email is invalid");

  const reference = input.messageIdHeader?.trim();
  return {
    actionKey: `founder-reply:${input.caseId}:${input.requestId}`,
    threadId: input.threadId,
    ...(reference && /^<[^<>\s]+>$/.test(reference)
      ? { messageIdHeader: reference }
      : {}),
    to: input.recipient,
    subject: safeSubject(input.subject),
    text,
  };
}

export function founderReplyHeaders(payload: FounderReplyPayload) {
  const reference = payload.messageIdHeader?.trim();
  const safeReference = reference && /^<[^<>\s]+>$/.test(reference) ? reference : undefined;
  return [
    `To: ${payload.to}`,
    `Subject: ${payload.subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    ...(safeReference
      ? [`In-Reply-To: ${safeReference}`, `References: ${safeReference}`]
      : []),
  ];
}
