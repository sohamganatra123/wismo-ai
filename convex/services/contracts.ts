import type { TrackingScan } from "../domain/tracking";

export type GmailMessage = {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  receivedAt: string;
  hasAttachments: boolean;
};

export interface GmailService {
  listMessages(afterHistoryId?: string): Promise<{ messages: GmailMessage[]; historyId?: string }>;
  getThread(threadId: string): Promise<GmailMessage[]>;
  sendMessage(input: { to: string; subject: string; text: string; threadId?: string; actionKey: string }): Promise<{ id: string; threadId: string }>;
}

export type ShopifyOrderSnapshot = {
  customerId: string;
  orderId: string;
  orderName: string;
  createdAt: string;
  lineItemDescriptions: string[];
  fulfillmentStatus: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

export interface ShopifyService {
  findCustomerByEmail(email: string): Promise<{ id: string; name: string; email: string; phone?: string; shippingAddress?: string } | null>;
  listOrders(customerId: string): Promise<ShopifyOrderSnapshot[]>;
  addOrderNote(input: { orderId: string; note: string; actionKey: string }): Promise<void>;
  updateTracking(input: { fulfillmentId: string; trackingNumber: string; trackingUrl?: string; company?: string; actionKey: string }): Promise<void>;
}

export type AgentDecision = {
  isWismo: boolean;
  confidence: number;
  needsClarification: boolean;
  intendedOrderId: string | null;
  recommendedAction: string;
  customerDraft: string | null;
  reason: string;
  scans: TrackingScan[];
};

export interface AgentService {
  decide(input: { message: GmailMessage; orders: ShopifyOrderSnapshot[]; previousMessages: GmailMessage[] }): Promise<{ decision: AgentDecision; inputTokens: number; outputTokens: number }>;
}
