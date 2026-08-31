export type ShopifyNotePayload = { actionKey: string; orderId: string; note: string };

export function shopifyNotePayload(input: { caseId: string; orderId: string; trackingNumber: string; status: string; eventTime: string }): ShopifyNotePayload {
  return {
    actionKey: `courier-note:${input.caseId}:${input.eventTime}`,
    orderId: input.orderId,
    note: `WISMO courier update: ${input.status.replaceAll("_", " ").toLowerCase()} for tracking ${input.trackingNumber} at ${input.eventTime}.`,
  };
}

export function claimableShopifyNote(approval: { kind: string; status: string; payload: unknown } | null): ShopifyNotePayload {
  if (!approval || approval.kind !== "shopify_note") throw new Error("Shopify note approval not found");
  if (approval.status !== "pending") throw new Error("This Shopify note was already handled");
  const value = approval.payload as Partial<ShopifyNotePayload> | null;
  if (!value || typeof value.actionKey !== "string" || !value.actionKey.startsWith("courier-note:") || typeof value.orderId !== "string" || typeof value.note !== "string") throw new Error("Invalid Shopify note payload");
  return value as ShopifyNotePayload;
}
