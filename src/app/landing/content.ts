export type JourneyStep = {
  label: "RECEIVE" | "SCAN" | "CHECK COURIER" | "REPLY" | "RESOLVE";
  title: string;
  body: string;
};

export type LandingContent = {
  hero: {
    eyebrow: string;
    brand: string;
    headline: string;
    body: string;
    cta: { label: string; href: "/connect" };
    secondaryCta: { label: string; href: "/login" };
    note: string;
  };
  support: { eyebrow: string; headline: string; body: string; labels: string[] };
  journey: { modeLabel: string; eyebrow: string; headline: string };
  journeySteps: JourneyStep[];
  proof: {
    eyebrow: string;
    headline: string;
    body: string;
    results: Array<"PASSED" | "REVIEWED" | "STOPPED">;
    gateNote: string;
  };
  finalCta: {
    eyebrow: string;
    headline: string;
    body: string;
    cta: { label: string; href: "/connect" };
    secondaryCta: { label: string; href: "/login" };
    note: string;
    safetyNote: string;
    scopeNote: string;
  };
};

export const landingContent: LandingContent = {
  hero: {
    eyebrow: "AUTONOMOUS WISMO RESOLUTION FOR SHOPIFY",
    brand: "WISMO.ai",
    headline: "Where is my order? Wismo resolves it.",
    body: "Wismo finds the right order, verifies the newest courier scan, and sends the answer in your brand voice—autonomously after that case type clears your safety gate. V1 keeps manager approval on while that proof is built.",
    cta: { label: "Connect support mailbox", href: "/connect" },
    secondaryCta: { label: "Log in", href: "/login" },
    note: "Setup takes about 5 minutes · progress stays on this device",
  },
  support: {
    eyebrow: "ONE SMALL EMAIL",
    headline: "One “where is my order?” email. Seven places to look.",
    body: "Wismo pulls the customer, order, fulfillment, tracking, prior emails, linked cases, and courier replies into one traceable case.",
    labels: ["CUSTOMER", "ORDER", "FULFILLMENT", "TRACKING", "PAST EMAILS", "LINKED CASES", "COURIER REPLIES"],
  },
  journey: {
    modeLabel: "AUTONOMOUS MODE · AFTER SAFETY GATE",
    eyebrow: "ONE QUESTION. ZERO HANDOFFS.",
    headline: "Watch one order answer itself.",
  },
  journeySteps: [
    { label: "RECEIVE", title: "The question lands.", body: "Wismo recognizes the WISMO request in the shared support inbox and opens a case." },
    { label: "SCAN", title: "Wismo finds the right order.", body: "A cobalt scan crosses the parcel while Wismo matches the sender, Shopify order, fulfillment, and exact tracking number." },
    { label: "CHECK COURIER", title: "The latest status comes back.", body: "Wismo checks the courier, rejects mismatched tracking, sorts scans by event time, and returns the newest valid status." },
    { label: "REPLY", title: "The customer gets the answer.", body: "Wismo writes in the store’s voice and sends the verified update without handing the case to a person." },
    { label: "RESOLVE", title: "The case closes itself.", body: "The reply, sources, actions, and timestamps stay attached to the case until delivery is confirmed." },
  ],
  proof: {
    eyebrow: "THE TEST THAT CHANGED V1",
    headline: "Two bad answers were enough to stop autonomous sending.",
    body: "In the first 10-case test, six passed, two needed human review, and two failed dangerously. That is why messages and Shopify changes require manager approval in v1.",
    results: ["PASSED", "PASSED", "PASSED", "PASSED", "PASSED", "PASSED", "REVIEWED", "REVIEWED", "STOPPED", "STOPPED"],
    gateNote: "Autonomy stays off until a larger representative test reaches at least 90% without manager correction and produces zero dangerous failures.",
  },
  finalCta: {
    eyebrow: "AUTONOMOUS WISMO RESOLUTION",
    headline: "Turn WISMO questions into finished work.",
    body: "Connect the shared support inbox. Wismo finds the order, checks the courier, and completes the reply.",
    cta: { label: "Connect support mailbox", href: "/connect" },
    secondaryCta: { label: "Log in", href: "/login" },
    note: "Setup takes about 5 minutes · progress stays on this device.",
    safetyNote: "V1 requires manager approval. Autonomous sending unlocks only after the safety gate is met.",
    scopeNote: "Built for Gmail + Shopify WISMO cases. Email only in v1.",
  },
};
