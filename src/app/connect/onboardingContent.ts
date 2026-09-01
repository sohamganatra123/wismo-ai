import type { AutonomyMode, OnboardingState, OnboardingStep } from "./onboardingTypes";

export type JourneyStageId = "brief" | "evidence" | "voice" | "proof" | "control";

export type JourneyStage = {
  id: JourneyStageId;
  number: "01" | "02" | "03" | "04" | "05";
  label: string;
  hint: string;
  reducerStep: OnboardingStep;
};

export const journeyStages: JourneyStage[] = [
  { id: "brief", number: "01", label: "Brief", hint: "Set the mission", reducerStep: "account" },
  { id: "evidence", number: "02", label: "Evidence", hint: "Give WISMO context", reducerStep: "gmail" },
  { id: "voice", number: "03", label: "Voice", hint: "Teach its judgment", reducerStep: "voice" },
  { id: "proof", number: "04", label: "Proof", hint: "Watch it investigate", reducerStep: "test" },
  { id: "control", number: "05", label: "Control", hint: "Choose the boundary", reducerStep: "launch" },
];

const stageByStep: Record<OnboardingStep, JourneyStageId> = {
  account: "brief",
  gmail: "evidence",
  shopify: "evidence",
  voice: "voice",
  test: "proof",
  launch: "control",
};

export function stageForStep(step: OnboardingStep) {
  const stageId = stageByStep[step];
  return journeyStages.find((stage) => stage.id === stageId) ?? journeyStages[0];
}

export type AgentStatus = {
  label: string;
  detail: string;
  tone: "waiting" | "working" | "decision" | "ready" | "error";
};

export function agentStatusForState(state: OnboardingState): AgentStatus {
  if (state.active) return { label: "Ready for work", detail: "Your control level is saved.", tone: "ready" };
  if (state.step === "account") return { label: "Waiting for your brief", detail: "Tell WISMO who owns this setup.", tone: "waiting" };
  if (state.step === "gmail") {
    if (state.gmail === "connecting") return { label: "Checking inbox access", detail: "Reading the permissions you approved.", tone: "working" };
    if (state.gmail === "error") return { label: "Inbox access needs attention", detail: "Review the source and try again.", tone: "error" };
    return { label: "Waiting for inbox access", detail: "WISMO needs customer questions as evidence.", tone: "waiting" };
  }
  if (state.step === "shopify") {
    if (state.shopify === "connecting") return { label: "Learning from your store", detail: "Checking the storefront and reading its voice.", tone: "working" };
    if (state.shopify === "error") return { label: "Store source needs attention", detail: "Check the address and try again.", tone: "error" };
    return { label: "One source verified", detail: "Add Shopify facts to complete the evidence set.", tone: "ready" };
  }
  if (state.step === "voice") return { label: "Learning your voice", detail: "Review what WISMO inferred and correct it.", tone: "working" };
  if (state.step === "test") {
    if (state.testStatus === "error") return { label: "Proof run needs attention", detail: "The case stopped safely. Run it again.", tone: "error" };
    if (state.testStatus !== "idle") return { label: "Investigating the proof case", detail: "Matching identity, order, tracking, and reply.", tone: "working" };
    return { label: "Ready to investigate", detail: "Start one case and watch every evidence check.", tone: "waiting" };
  }
  return { label: "Needs your decision", detail: "Choose how much WISMO may do on its own.", tone: "decision" };
}

export type AutonomyModeContent = {
  id: AutonomyMode;
  label: string;
  description: string;
  alone: string;
  approval: string;
  recommended?: true;
};

export const autonomyModes: AutonomyModeContent[] = [
  {
    id: "investigate",
    label: "Investigate only",
    description: "WISMO gathers the evidence and recommends the next step.",
    alone: "Collect and organize verified evidence",
    approval: "A manager writes and sends every reply",
  },
  {
    id: "approval",
    label: "Draft for approval",
    description: "WISMO investigates and writes the reply. A manager approves it before anything is sent.",
    alone: "Investigate cases and prepare replies",
    approval: "A manager approves every outgoing message",
    recommended: true,
  },
  {
    id: "verified",
    label: "Resolve verified cases",
    description: "WISMO acts only when identity, order, and the newest tracking status all agree.",
    alone: "Resolve cases with complete matching evidence",
    approval: "Every conflict, correction, or exception goes to a manager",
  },
];

export function autonomyModeContent(mode: AutonomyMode) {
  return autonomyModes.find((item) => item.id === mode) ?? autonomyModes[1];
}
