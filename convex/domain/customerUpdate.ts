import { hasExactTrackingMatch, type TrackingScan } from "./tracking";

export type CustomerUpdatePayload = {
  actionKey: string;
  threadId: string;
  messageIdHeader?: string;
  to: string;
  subject: string;
  text: string;
  orderName: string;
  trackingNumber: string;
  trackingEventTime: string;
};

type CustomerUpdateApproval = { kind: string; status: string; payload: unknown };

function replySubject(subject: string) {
  const safe = subject.replace(/[\r\n]+/g, " ").trim();
  if (!safe || safe === "(no subject)") return "Re: Delivery update";
  return /^re:/i.test(safe) ? safe : `Re: ${safe}`;
}

function readable(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function customerUpdateDraft(input: {
  caseId: string;
  threadId: string;
  messageIdHeader?: string;
  recipient: string;
  subject: string;
  orderName: string;
  fulfillmentStatus: string;
  orderTrackingNumber: string;
  latestTracking: TrackingScan;
}): CustomerUpdatePayload {
  if (!hasExactTrackingMatch(input.orderTrackingNumber, input.latestTracking.trackingNumber)) {
    throw new Error("Tracking number does not match the selected order");
  }
  const location = input.latestTracking.location ? ` in ${input.latestTracking.location}` : "";
  const description = input.latestTracking.description ? ` ${input.latestTracking.description.trim()}` : "";
  return {
    actionKey: `tracking-update:${input.caseId}:${input.latestTracking.eventTime}`,
    threadId: input.threadId,
    ...(input.messageIdHeader
      ? { messageIdHeader: input.messageIdHeader.replace(/[\r\n]+/g, "").trim() }
      : {}),
    to: input.recipient,
    subject: replySubject(input.subject),
    text: `Hi,\n\nI checked order ${input.orderName}. Its fulfillment status is ${readable(input.fulfillmentStatus)}. The latest confirmed tracking update is ${readable(input.latestTracking.status)}${location} as of ${input.latestTracking.eventTime}.${description}\n\nTracking number: ${input.orderTrackingNumber}\n\nWISMO`,
    orderName: input.orderName,
    trackingNumber: input.orderTrackingNumber,
    trackingEventTime: input.latestTracking.eventTime,
  };
}

export function isCustomerUpdatePayload(value: unknown): value is CustomerUpdatePayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.actionKey === "string" &&
    item.actionKey.startsWith("tracking-update:") &&
    typeof item.threadId === "string" &&
    (item.messageIdHeader === undefined || typeof item.messageIdHeader === "string") &&
    typeof item.to === "string" &&
    typeof item.subject === "string" &&
    typeof item.text === "string" &&
    typeof item.orderName === "string" &&
    typeof item.trackingNumber === "string" &&
    typeof item.trackingEventTime === "string"
  );
}

export function customerUpdateHeaders(payload: CustomerUpdatePayload) {
  const candidate = payload.messageIdHeader?.trim();
  const reference = candidate && /^<[^<>\s]+>$/.test(candidate) ? candidate : undefined;
  return [
    `To: ${payload.to}`,
    `Subject: ${payload.subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    ...(reference ? [`In-Reply-To: ${reference}`, `References: ${reference}`] : []),
  ];
}

export function claimableCustomerUpdate(approval: CustomerUpdateApproval | null) {
  if (!approval || approval.kind !== "customer_email") throw new Error("Customer update approval not found");
  if (approval.status !== "pending") throw new Error("This customer update was already handled");
  if (!isCustomerUpdatePayload(approval.payload)) throw new Error("Invalid customer update payload");
  return approval.payload;
}
