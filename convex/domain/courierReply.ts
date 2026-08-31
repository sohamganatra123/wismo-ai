import { hasExactTrackingMatch, type TrackingScan } from "./tracking";

type CourierReplyInput = {
  configuredEmail: string;
  senderEmail: string;
  waitingThreadId: string;
  replyThreadId: string;
  orderTrackingNumber: string;
  reply: TrackingScan;
};

export function matchCourierReply(input: CourierReplyInput):
  | { ok: true; scan: TrackingScan }
  | { ok: false; reason: string } {
  if (input.senderEmail.trim().toLowerCase() !== input.configuredEmail.trim().toLowerCase()) {
    return { ok: false, reason: "Reply did not come from the configured courier" };
  }
  if (input.replyThreadId !== input.waitingThreadId) {
    return { ok: false, reason: "Reply did not match the waiting conversation" };
  }
  if (!hasExactTrackingMatch(input.orderTrackingNumber, input.reply.trackingNumber)) {
    return { ok: false, reason: "Tracking number did not match the selected order" };
  }
  if (!Number.isFinite(Date.parse(input.reply.eventTime))) {
    return { ok: false, reason: "Courier event time was invalid" };
  }
  return { ok: true, scan: input.reply };
}
