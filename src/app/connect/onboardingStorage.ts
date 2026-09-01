import { initialOnboardingState, type OnboardingState } from "./onboardingTypes";

export const ONBOARDING_STORAGE_KEY = "wismo:onboarding:v3";
const LEGACY_STORAGE_KEY = "wismo:onboarding:v2";
const steps = new Set(["account", "gmail", "shopify", "voice", "test", "launch"]);
const connections = new Set(["idle", "connecting", "connected", "error"]);
const testStatuses = new Set(["idle", "sending", "received", "checking", "prepared", "error"]);
const autonomyModes = new Set(["investigate", "approval", "verified"]);

function isBaseStoredState(value: unknown): value is Omit<OnboardingState, "autonomyMode"> & { autonomyMode?: unknown } {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<OnboardingState>;
  return typeof state.step === "string" && steps.has(state.step) && typeof state.name === "string" && typeof state.email === "string" && typeof state.gmail === "string" && connections.has(state.gmail) && typeof state.shopify === "string" && connections.has(state.shopify) && typeof state.shopDomain === "string" && typeof state.voiceAccepted === "boolean" && typeof state.testStatus === "string" && testStatuses.has(state.testStatus) && typeof state.active === "boolean";
}

function isStoredState(value: unknown): value is OnboardingState {
  return isBaseStoredState(value) && typeof value.autonomyMode === "string" && autonomyModes.has(value.autonomyMode);
}

export function loadOnboarding(): OnboardingState {
  if (typeof window === "undefined") return initialOnboardingState;
  try {
    const value = JSON.parse(window.localStorage.getItem(ONBOARDING_STORAGE_KEY) ?? "null");
    if (value?.version === 3 && isStoredState(value.state)) return { ...initialOnboardingState, ...value.state };
    const legacy = JSON.parse(window.localStorage.getItem(LEGACY_STORAGE_KEY) ?? "null");
    return legacy?.version === 2 && isBaseStoredState(legacy.state)
      ? { ...initialOnboardingState, ...legacy.state, autonomyMode: "approval" }
      : initialOnboardingState;
  } catch { return initialOnboardingState; }
}

export function saveOnboarding(state: OnboardingState) {
  if (typeof window !== "undefined") window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ version: 3, state }));
}

export function clearOnboarding() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}
