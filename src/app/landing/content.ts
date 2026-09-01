export type JourneyStep = {
  label: "RECEIVE" | "SCAN" | "CHECK COURIER" | "REPLY" | "RESOLVE";
  title: string;
  body: string;
};

type TrustItem = { label: string; body: string };
type NextStep = { label: string; title: string; body: string };
type FaqItem = { question: string; answer: string };

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
  trust: {
    eyebrow: string;
    headline: string;
    body: string;
    items: TrustItem[];
  };
  nextSteps: {
    eyebrow: string;
    headline: string;
    steps: NextStep[];
  };
  faq: {
    eyebrow: string;
    headline: string;
    items: FaqItem[];
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
    cta: { label: "Join early access", href: "/connect" },
    secondaryCta: { label: "Log in", href: "/login" },
    note: "Early access opens in small batches · start with your work email",
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
  trust: {
    eyebrow: "THE SAFETY BOUNDARY",
    headline: "See the evidence. Keep the final say.",
    body: "Early access starts in approval mode. Wismo can investigate and prepare the work, but it cannot quietly act outside the boundary below.",
    items: [
      {
        label: "Data Wismo can access",
        body: "Only connected sources needed for a case: shared Gmail threads, matched Shopify customer and order records, fulfillment and tracking details, and courier replies.",
      },
      {
        label: "Actions that need approval",
        body: "In v1, every outgoing customer or courier message and every Shopify change waits for a manager to approve it.",
      },
      {
        label: "How incorrect replies are stopped",
        body: "Wismo checks customer, order, and tracking identity before drafting. Missing or conflicting evidence goes to human attention instead of being sent.",
      },
      {
        label: "How data is used",
        body: "Connected data is used to investigate cases and prepare replies. Wismo does not run training jobs on merchant or customer data; model-provider handling will be disclosed before you connect.",
      },
      {
        label: "How access is revoked",
        body: "You can revoke Google or Shopify access from those providers at any time. During early access, founder-led support can also remove stored connection credentials; self-service removal is not available yet.",
      },
      {
        label: "What the first test showed",
        body: "In the first 10-case safety test, 6 passed, 2 needed review, and 2 were stopped. That result shaped approval-first v1; it is not a production accuracy claim.",
      },
    ],
  },
  nextSteps: {
    eyebrow: "WHAT HAPPENS NEXT",
    headline: "One email now. Connection details later.",
    steps: [
      {
        label: "01 / JOIN",
        title: "Leave your work email.",
        body: "Your work email is the only information the early-access form asks for.",
      },
      {
        label: "02 / FIT CHECK",
        title: "We confirm the setup together.",
        body: "We will ask about your company, Shopify store, support inbox, and current WISMO volume before anything connects.",
      },
      {
        label: "03 / CONTROLLED START",
        title: "Begin with manager approval on.",
        body: "You review Wismo’s evidence and drafts before an external message or Shopify change can happen.",
      },
    ],
  },
  faq: {
    eyebrow: "EARLY-ACCESS FAQ",
    headline: "Before you hand over an inbox.",
    items: [
      {
        question: "Is Wismo available now?",
        answer: "Wismo is opening early access in small batches. Joining the list requests access; it does not connect your inbox immediately.",
      },
      {
        question: "What does Wismo read?",
        answer: "Wismo uses the connected Gmail, Shopify, fulfillment, tracking, and courier information needed to investigate a WISMO case. Exact permissions are reviewed before connection.",
      },
      {
        question: "Does Wismo train on customer data?",
        answer: "Wismo does not run training jobs on merchant or customer data. Before connection, we will disclose the model provider and the provider’s data-handling terms so you can review them.",
      },
      {
        question: "Can Wismo send a reply without approval?",
        answer: "Not in v1. Customer messages, courier messages, and Shopify changes require manager approval. Autonomous sending remains locked behind the safety gate.",
      },
      {
        question: "Can I disconnect Gmail or Shopify?",
        answer: "Yes. You can revoke access through Google or Shopify at any time. During early access, founder-led support can remove stored connection credentials as well.",
      },
      {
        question: "What happens after I join?",
        answer: "We review fit, contact you at your work email, explain permissions and data handling, and schedule founder-led onboarding when a slot opens.",
      },
      {
        question: "Is pricing set?",
        answer: "Not yet. You will see any price and early-access terms before you connect a mailbox or store.",
      },
    ],
  },
  finalCta: {
    eyebrow: "AUTONOMOUS WISMO RESOLUTION",
    headline: "Turn WISMO questions into finished work.",
    body: "Join early access with your work email. We will review fit and walk through permissions before anything connects.",
    cta: { label: "Join early access", href: "/connect" },
    secondaryCta: { label: "Log in", href: "/login" },
    note: "Start with one work email. Company and connection details come later.",
    safetyNote: "V1 requires manager approval. Autonomous sending unlocks only after the safety gate is met.",
    scopeNote: "Built for Gmail + Shopify WISMO cases. Email only in v1.",
  },
};
