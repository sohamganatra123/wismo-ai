export type InboundClassification = "wismo" | "clarification" | "unrelated";

const DELIVERY_SIGNAL =
  /\b(wismo|order|delivery|delivered|courier|tracking|track|shipment|package|parcel|dispatch(?:ed)?|transit)\b/i;
const CLEAR_REQUEST =
  /\b(where|when|status|update|track|tracking|locate|eta|arriv(?:e|ed|ing)|delivered|late|delay(?:ed)?|missing|lost|has(?:n't| not)|haven't|have not)\b/i;

export function classifyInboundEmail(input: {
  subject: string;
  text: string;
}): InboundClassification {
  const subject = input.subject === "(no subject)" ? "" : input.subject;
  const content = `${subject} ${input.text}`.replace(/\s+/g, " ").trim();

  if (!content) return "clarification";
  if (!DELIVERY_SIGNAL.test(content)) return "unrelated";
  return CLEAR_REQUEST.test(content) ? "wismo" : "clarification";
}
