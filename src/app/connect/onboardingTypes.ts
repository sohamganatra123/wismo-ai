export type OnboardingStep = "account" | "gmail" | "shopify" | "voice" | "test" | "launch";
export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
export type TestStatus = "idle" | "sending" | "received" | "checking" | "prepared" | "error";
export type AutonomyMode = "investigate" | "approval" | "verified";

export type VoiceProfile = {
  storeName: string;
  ink: string;
  canvas: string;
  accent: string;
  traits: string[];
  greeting: string;
  guidance: string;
};

export type OnboardingState = {
  step: OnboardingStep;
  name: string;
  email: string;
  gmail: ConnectionStatus;
  shopify: ConnectionStatus;
  shopDomain: string;
  voice: VoiceProfile | null;
  voiceAccepted: boolean;
  testStatus: TestStatus;
  autonomyMode: AutonomyMode;
  active: boolean;
};

export const initialOnboardingState: OnboardingState = {
  step: "account", name: "", email: "", gmail: "idle", shopify: "idle", shopDomain: "",
  voice: null, voiceAccepted: false, testStatus: "idle", autonomyMode: "approval", active: false,
};

export type OnboardingAction =
  | { type: "ACCOUNT_COMPLETED"; name: string; email: string }
  | { type: "GMAIL_CONNECT_STARTED" } | { type: "GMAIL_CONNECTED" } | { type: "GMAIL_FAILED" }
  | { type: "SHOPIFY_CONNECT_STARTED"; domain: string } | { type: "SHOPIFY_CONNECTED"; domain: string; voice: VoiceProfile } | { type: "SHOPIFY_FAILED" }
  | { type: "VOICE_UPDATED"; voice: VoiceProfile } | { type: "VOICE_ACCEPTED" }
  | { type: "TEST_STARTED" } | { type: "TEST_ADVANCED"; status: TestStatus } | { type: "TEST_FAILED" }
  | { type: "AUTONOMY_SELECTED"; mode: AutonomyMode }
  | { type: "AUTOMATION_ACTIVATED" } | { type: "EDIT_AUTONOMY" }
  | { type: "GO_BACK"; step: OnboardingStep } | { type: "RESTORED"; state: OnboardingState };
