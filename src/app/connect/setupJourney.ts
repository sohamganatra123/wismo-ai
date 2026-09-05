import type { AutonomyMode } from "./onboardingTypes";

export type SetupStageId = "brief" | "sources" | "learn" | "review" | "activate";

export type SetupStage = {
  id: SetupStageId;
  number: "01" | "02" | "03" | "04" | "05";
  label: string;
  hint: string;
};

export type SetupStageState = "locked" | "current" | "done";

export type SetupProgressInput = {
  briefConfirmed: boolean;
  gmailConnected: boolean;
  ordersLoaded: boolean;
  shopifyConnected: boolean;
  contactCount: number;
  ruleCount: number;
  pendingMemoryCount: number;
  reviewConfirmed: boolean;
  activated: boolean;
};

export type SetupProgress = {
  briefDone: boolean;
  sourcesDone: boolean;
  learnDone: boolean;
  reviewDone: boolean;
  activated: boolean;
  stageStates: Record<SetupStageId, SetupStageState>;
};

export type SetupDraft = {
  mode: AutonomyMode;
  briefConfirmed: boolean;
  reviewConfirmed: boolean;
  activated: boolean;
};

export const setupStages: SetupStage[] = [
  { id: "brief", number: "01", label: "Brief", hint: "Set the operating boundary" },
  { id: "sources", number: "02", label: "Sources", hint: "Connect Gmail and load orders" },
  { id: "learn", number: "03", label: "Learn", hint: "Add team rules and contacts" },
  { id: "review", number: "04", label: "Review", hint: "Check readiness and memory" },
  { id: "activate", number: "05", label: "Activate", hint: "Turn on the workspace" },
];

export const defaultSetupDraft: SetupDraft = {
  mode: "approval",
  briefConfirmed: false,
  reviewConfirmed: false,
  activated: false,
};

export function deriveSetupProgress(input: SetupProgressInput): SetupProgress {
  const contactCount = Math.max(0, input.contactCount);
  const ruleCount = Math.max(0, input.ruleCount);
  const pendingMemoryCount = Math.max(0, input.pendingMemoryCount);

  const briefDone = input.briefConfirmed;
  const sourcesDone = briefDone && input.gmailConnected && (input.ordersLoaded || input.shopifyConnected);
  const learnDone = sourcesDone && contactCount > 0 && ruleCount > 0;
  const reviewDone = learnDone && pendingMemoryCount === 0 && input.reviewConfirmed;
  const activated = reviewDone && input.activated;

  const stageStates: Record<SetupStageId, SetupStageState> = {
    brief: briefDone ? "done" : "current",
    sources: !briefDone ? "locked" : sourcesDone ? "done" : "current",
    learn: !sourcesDone ? "locked" : learnDone ? "done" : "current",
    review: !learnDone ? "locked" : reviewDone ? "done" : "current",
    activate: !reviewDone ? "locked" : activated ? "done" : "current",
  };

  return {
    briefDone,
    sourcesDone,
    learnDone,
    reviewDone,
    activated,
    stageStates,
  };
}

export function firstIncompleteStage(progress: SetupProgress): SetupStageId {
  if (!progress.briefDone) return "brief";
  if (!progress.sourcesDone) return "sources";
  if (!progress.learnDone) return "learn";
  if (!progress.reviewDone) return "review";
  return "activate";
}

export function visibleSetupStage(
  progress: SetupProgress,
  selectedStage: SetupStageId | null,
): SetupStageId {
  const fallbackStage = progress.activated ? "activate" : firstIncompleteStage(progress);
  if (!selectedStage) return fallbackStage;
  return progress.stageStates[selectedStage] === "locked" ? fallbackStage : selectedStage;
}
