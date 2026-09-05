export type ManualReplyCapability = {
  allowed: boolean;
  reason: "founder_only" | "case_closed" | "reply_already_sent" | "available";
};

export function manualReplyCapability(input: {
  role: string | null | undefined;
  caseStatus: string;
  hasFounderReply: boolean;
}): ManualReplyCapability {
  if (input.role !== "founder") return { allowed: false, reason: "founder_only" };
  if (input.caseStatus === "closed") return { allowed: false, reason: "case_closed" };
  if (input.hasFounderReply) return { allowed: false, reason: "reply_already_sent" };
  return { allowed: true, reason: "available" };
}
