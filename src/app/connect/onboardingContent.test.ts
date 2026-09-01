import { describe, expect, it } from "vitest";
import {
  agentStatusForState,
  autonomyModes,
  journeyStages,
  stageForStep,
} from "./onboardingContent";
import { initialOnboardingState } from "./onboardingTypes";

describe("agentic onboarding content", () => {
  it("presents five visible stages and groups both evidence sources", () => {
    expect(journeyStages.map((stage) => stage.label)).toEqual([
      "Brief", "Evidence", "Voice", "Proof", "Control",
    ]);
    expect(stageForStep("gmail").id).toBe("evidence");
    expect(stageForStep("shopify").id).toBe("evidence");
  });

  it("describes all three selectable control modes", () => {
    expect(autonomyModes.map((mode) => mode.id)).toEqual([
      "investigate", "approval", "verified",
    ]);
    expect(autonomyModes.find((mode) => mode.id === "approval")?.recommended).toBe(true);
  });

  it("reports agent activity from reducer state", () => {
    expect(agentStatusForState(initialOnboardingState).label).toBe("Waiting for your brief");
    expect(agentStatusForState({ ...initialOnboardingState, step: "gmail" }).label).toBe("Waiting for inbox access");
    expect(agentStatusForState({ ...initialOnboardingState, step: "gmail", gmail: "connecting" }).label).toBe("Checking inbox access");
    expect(agentStatusForState({ ...initialOnboardingState, step: "shopify", gmail: "connected", shopify: "connecting" }).label).toBe("Learning from your store");
    expect(agentStatusForState({ ...initialOnboardingState, step: "voice", gmail: "connected", shopify: "connected" }).label).toBe("Learning your voice");
    expect(agentStatusForState({ ...initialOnboardingState, step: "test", testStatus: "checking" }).label).toBe("Investigating the proof case");
    expect(agentStatusForState({ ...initialOnboardingState, step: "launch" }).label).toBe("Needs your decision");
    expect(agentStatusForState({ ...initialOnboardingState, step: "launch", active: true }).label).toBe("Ready for work");
  });
});
