export function matchedShopifyTransition<T>(orderIds: T[]) {
  return {
    candidateOrderIds: [...orderIds],
    orderId: orderIds.length === 1 ? orderIds[0] : undefined,
    status: orderIds.length === 1 ? "investigating" as const : "order_needed" as const,
    scheduleAgent: true as const,
  };
}
