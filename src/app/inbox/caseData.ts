export type CaseRecord = {
  id: string; customer: string; initials: string; email: string; customerSince: string;
  order: string; product: string; orderDate: string; fulfillment: string;
  trackingNumber: string; trackingStatus: string; trackingTime: string;
  reason: string; deadline: string; urgency: "urgent" | "watch"; recommendation: string; note: string; question: string;
  messages: Array<{ from: string; text: string; time: string }>;
  steps: Array<{ title: string; detail: string; time: string; state: "verified" | "blocked" }>;
  linkedCases: Array<{ id: string; title: string; outcome: string }>;
};

export const cases: CaseRecord[] = [
  {
    id: "WIS-1048", customer: "Amina Malik", initials: "AM", email: "amina@example.com", customerSince: "Customer since 2024",
    order: "#4921", product: "Linen overshirt · Sand · M", orderDate: "28 Aug 2026", fulfillment: "Fulfilled by Northstar Goods",
    trackingNumber: "TRK-123", trackingStatus: "Delivery attempt failed", trackingTime: "Today · 11:00",
    reason: "Tracking conflict", deadline: "18 min", urgency: "urgent",
    recommendation: "Ask Northline which scan is current before replying to Amina.", note: "Shopify says out for delivery; the courier feed says delivery failed.",
    question: "Hi, do you know where my linen overshirt is? The tracking page has not changed since this morning.",
    messages: [
      { from: "Amina", text: "Is this still arriving today?", time: "Today · 11:18" },
      { from: "WISMO", text: "Investigation paused while the two tracking states are checked.", time: "Today · 11:19" },
      { from: "Support", text: "We confirmed the delivery address yesterday.", time: "Yesterday · 16:42" },
    ],
    steps: [
      { title: "Matched customer", detail: "Sender exactly matches Amina’s Shopify profile.", time: "00:01", state: "verified" },
      { title: "Found order", detail: "One active order contains the linen overshirt.", time: "00:05", state: "verified" },
      { title: "Checked newest tracking", detail: "Northline reports a failed attempt at 11:00.", time: "00:18", state: "verified" },
      { title: "Stopped customer reply", detail: "Shopify still reports out for delivery, so no answer was prepared.", time: "00:20", state: "blocked" },
    ], linkedCases: [{ id: "WIS-0971", title: "Address confirmation", outcome: "Resolved · 30 Aug" }],
  },
  {
    id: "WIS-1046", customer: "Jon Bell", initials: "JB", email: "jon@example.com", customerSince: "Customer since 2025",
    order: "#4887", product: "Field jacket · Olive · L", orderDate: "26 Aug 2026", fulfillment: "Fulfilled by Northstar Goods", trackingNumber: "TRK-118", trackingStatus: "In transit", trackingTime: "Today · 09:20",
    reason: "Identity needs review", deadline: "34 min", urgency: "watch", recommendation: "Verify the checkout email before showing any order details.", note: "The sender address does not match the Shopify customer record.", question: "Can you tell me where my recent order is?",
    messages: [{ from: "Jon", text: "I used my work email for this message.", time: "Today · 10:02" }], steps: [{ title: "Found possible customer", detail: "Name matches, but the email address does not.", time: "00:04", state: "blocked" }], linkedCases: [],
  },
  {
    id: "WIS-1041", customer: "Mei Tan", initials: "MT", email: "mei@example.com", customerSince: "Customer since 2023",
    order: "#4812", product: "Canvas tote · Natural", orderDate: "21 Aug 2026", fulfillment: "Fulfilled by Northstar Goods", trackingNumber: "TRK-102", trackingStatus: "No new scan", trackingTime: "3 days ago · 18:10",
    reason: "Courier did not reply", deadline: "52 min", urgency: "watch", recommendation: "Approve escalation to the store support lead.", note: "Three courier follow-ups were sent with no new tracking information.", question: "My package has not moved in three days. Can someone check?",
    messages: [{ from: "Mei", text: "The estimated date was yesterday.", time: "Today · 08:44" }], steps: [{ title: "Courier follow-ups exhausted", detail: "Three requests were sent three hours apart.", time: "09:00", state: "blocked" }], linkedCases: [],
  },
];

export function getCase(caseId: string) { return cases.find((item) => item.id === caseId); }
