import type { OrderRecord } from "./orders";

export type EmailInput = { from: string; subject: string; body: string };
export type WorkflowDecision =
  | { kind: "ignore"; reason: string }
  | { kind: "clarify"; reason: string; response: string }
  | { kind: "respond"; reason: string; response: string; order: OrderRecord };

const RELEVANT = /\b(order|package|parcel|delivery|shipment|tracking|track)\b/i;
const ORDER_REFERENCE = /(?:order\s*(?:number|no\.?|id)?\s*[:#]?|#)\s*([a-z0-9-]{3,})/i;

function readable(value: string) {
  const normalized = value.replaceAll("_", " ").trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function decideEmail(input: EmailInput, orders: OrderRecord[], now = Date.now()): WorkflowDecision {
  const content = `${input.subject}\n${input.body}`;
  if (!RELEVANT.test(content)) {
    return { kind: "ignore", reason: "The message is not about an order or delivery." };
  }
  const sender = input.from.trim().toLowerCase();
  const reference = content.match(ORDER_REFERENCE)?.[1]?.toUpperCase();
  const senderOrders = orders.filter((order) => order.customerEmail === sender);
  const matches = reference
    ? senderOrders.filter((order) => order.orderId === reference)
    : senderOrders;

  if (matches.length !== 1) {
    const reason = matches.length > 1
      ? "More than one order matches this email address."
      : reference
        ? "That order number does not match the sender's email address."
        : "The message needs an order number or matching checkout email.";
    return {
      kind: "clarify",
      reason,
      response: "Hi,\n\nI can check this for you. Please reply with your order number and the email used at checkout.\n\nWISMO",
    };
  }

  const order = matches[0];
  const age = now - Date.parse(order.statusUpdatedAt);
  if (age < 0 || age > 24 * 60 * 60 * 1_000) {
    return {
      kind: "clarify",
      reason: "The matching order status is more than 24 hours old.",
      response: "Hi,\n\nI found your order, but its last status is not recent enough for a reliable answer. I’ve flagged it for a fresh check.\n\nWISMO",
    };
  }
  const tracking = order.trackingNumber ? ` Tracking number: ${order.trackingNumber}.` : "";
  const carrier = order.carrier ? ` with ${order.carrier}` : "";
  return {
    kind: "respond",
    reason: "One fresh order matches the sender and order reference.",
    order,
    response: `Hi ${order.customerName.split(" ")[0]},\n\nOrder #${order.orderId} is ${readable(order.status).toLowerCase()}${carrier}.${tracking}\n\nThis status was updated ${new Date(order.statusUpdatedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}.\n\nWISMO`,
  };
}
