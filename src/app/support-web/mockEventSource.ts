import type { EventSource, SupportSnapshot, SupportTicket } from "./types";
const QUESTIONS = ["Where is my order?", "Will this arrive today?", "Tracking hasn’t moved", "Can I change the address?", "The parcel says delivered"];
const CUSTOMERS = ["Amina M.", "Jon B.", "Maya R.", "Noah K.", "Sofia L."];
export function createMockEventSource(): EventSource {
  let arrivalTimer: ReturnType<typeof setTimeout> | undefined;
  const resolutionTimers = new Set<ReturnType<typeof setTimeout>>();
  let handled = 37, serial = 10482;
  let tickets: SupportTicket[] = [];
  const listeners = new Set<(snapshot: SupportSnapshot) => void>();
  const emit = () => { const snapshot: SupportSnapshot = { tickets, handled, endToEnd: 84 }; listeners.forEach((listener) => listener(snapshot)); };
  const tick = () => {
    const index = serial % QUESTIONS.length;
    const ticket: SupportTicket = { id: String(serial++), customer: CUSTOMERS[index], question: QUESTIONS[index], state: "incoming", receivedAt: Date.now() };
    tickets = [ticket, ...tickets].slice(0, 4); emit();
    const resolutionTimer = setTimeout(() => { tickets = tickets.map((item) => item.id === ticket.id ? { ...item, state: "resolved" } : item); handled += 1; emit(); resolutionTimers.delete(resolutionTimer); }, 2400);
    resolutionTimers.add(resolutionTimer);
    arrivalTimer = setTimeout(tick, 3200 + Math.random() * 1500);
  };
  return {
    subscribe(listener) { listeners.add(listener); emit(); return () => listeners.delete(listener); },
    start() { if (!arrivalTimer) tick(); },
    stop() { if (arrivalTimer) clearTimeout(arrivalTimer); resolutionTimers.forEach(clearTimeout); resolutionTimers.clear(); arrivalTimer = undefined; },
  };
}
