export type TicketState = "incoming" | "understood" | "resolved" | "escalated";
export type SupportTicket = { id: string; customer: string; question: string; state: TicketState; receivedAt: number };
export type SupportSnapshot = { tickets: SupportTicket[]; handled: number; endToEnd: number };
export type EventSource = { subscribe: (listener: (snapshot: SupportSnapshot) => void) => () => void; start: () => void; stop: () => void };
