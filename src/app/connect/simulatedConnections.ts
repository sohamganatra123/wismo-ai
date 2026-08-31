import type { TestStatus, VoiceProfile } from "./onboardingTypes";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const seededVoice: VoiceProfile = { storeName: "Northstar Goods", ink: "#17312B", canvas: "#F4EFE5", accent: "#D77A45", traits: ["Warm", "Direct", "Reassuring"], greeting: "Hi there —", guidance: "Lead with the current delivery status. Be warm, direct, and tell the customer what happens next." };

export async function connectGmail(email: string) { await wait(650); return { email }; }
export async function connectShopify(input: string) {
  await wait(700); if (input.includes("fail")) throw new Error("Could not connect this simulated store.");
  const domain = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return { domain: domain.includes(".") ? domain : `${domain}.myshopify.com` };
}
export async function analyzeStore() { await wait(850); return seededVoice; }
export async function runTestOrder(onEvent: (status: TestStatus) => void) {
  for (const status of ["sending", "received", "checking", "prepared"] as TestStatus[]) { onEvent(status); await wait(650); }
}
