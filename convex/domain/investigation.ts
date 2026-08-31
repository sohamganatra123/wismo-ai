import { chooseNewestMatchingScan, type TrackingScan } from "./tracking";

export type InvestigationOrder = {
  id: string;
  name: string;
  createdAt: string;
  lineItems: string[];
  fulfillmentStatus: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

export type InvestigationMessage = {
  id: string;
  subject: string;
  text: string;
  sentAt: number;
};

export type InvestigationEvidence = {
  order: InvestigationOrder;
  previousMessages: InvestigationMessage[];
  latestTracking: TrackingScan | null;
};

export function collectInvestigationEvidence(input: {
  order: InvestigationOrder | null;
  previousMessages: InvestigationMessage[];
  scans: TrackingScan[];
}): InvestigationEvidence {
  if (!input.order) throw new Error("A selected order is required");

  return {
    order: input.order,
    previousMessages: [...input.previousMessages].sort((left, right) => right.sentAt - left.sentAt),
    latestTracking: input.order.trackingNumber
      ? chooseNewestMatchingScan(input.order.trackingNumber, input.scans)
      : null,
  };
}
