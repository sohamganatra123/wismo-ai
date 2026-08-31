import { initialOnboardingState, type OnboardingAction, type OnboardingState } from "./onboardingTypes";

const stepOrder = ["account", "gmail", "shopify", "voice", "test", "launch"] as const;

function furthestStep(state: OnboardingState) {
  if (!state.name || !state.email) return "account";
  if (state.gmail !== "connected") return "gmail";
  if (state.shopify !== "connected") return "shopify";
  if (!state.voiceAccepted) return "voice";
  if (state.testStatus !== "prepared") return "test";
  return "launch";
}

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case "ACCOUNT_COMPLETED": {
      const changed = state.email !== action.email;
      return { ...state, name: action.name, email: action.email, ...(changed ? { gmail: "idle" as const, shopify: "idle" as const, shopDomain: "", voice: null, voiceAccepted: false, testStatus: "idle" as const, active: false } : {}), step: "gmail" };
    }
    case "GMAIL_CONNECT_STARTED": return state.name && state.email ? { ...state, gmail: "connecting", testStatus: "idle", active: false } : state;
    case "GMAIL_CONNECTED": return state.name && state.email ? { ...state, gmail: "connected", testStatus: "idle", active: false, step: "shopify" } : state;
    case "GMAIL_FAILED": return { ...state, gmail: "error" };
    case "SHOPIFY_CONNECT_STARTED": return state.gmail === "connected" ? { ...state, shopify: "connecting", shopDomain: action.domain, voice: null, voiceAccepted: false, testStatus: "idle", active: false } : state;
    case "SHOPIFY_CONNECTED": return state.gmail === "connected" && state.shopify === "connecting" ? { ...state, shopify: "connected", shopDomain: action.domain, voice: action.voice, voiceAccepted: false, testStatus: "idle", active: false, step: "voice" } : state;
    case "SHOPIFY_FAILED": return { ...state, shopify: "error" };
    case "VOICE_UPDATED": return state.shopify === "connected" ? { ...state, voice: action.voice, voiceAccepted: false } : state;
    case "VOICE_ACCEPTED": return state.shopify === "connected" && state.voice ? { ...state, voiceAccepted: true, step: "test" } : state;
    case "TEST_STARTED": return state.voiceAccepted ? { ...state, testStatus: "sending" } : state;
    case "TEST_ADVANCED": {
      const next: Record<string, string> = { sending: "received", received: "checking", checking: "prepared" };
      return state.voiceAccepted && next[state.testStatus] === action.status
        ? { ...state, testStatus: action.status, step: action.status === "prepared" ? "launch" : state.step }
        : state;
    }
    case "TEST_FAILED": return { ...state, testStatus: "error" };
    case "AUTOMATION_ACTIVATED": return state.testStatus === "prepared" ? { ...state, active: true } : state;
    case "GO_BACK": return stepOrder.indexOf(action.step) <= stepOrder.indexOf(furthestStep(state)) ? { ...state, step: action.step } : state;
    case "RESTORED": return { ...initialOnboardingState, ...action.state };
  }
}
