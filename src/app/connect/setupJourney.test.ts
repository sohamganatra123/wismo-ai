import { describe, expect, it } from "vitest";
import {
  defaultSetupDraft,
  deriveSetupProgress,
  firstIncompleteStage,
  visibleSetupStage,
} from "./setupJourney";

describe("setupJourney", () => {
  it("locks later stages until earlier ones are complete", () => {
    const progress = deriveSetupProgress({
      briefConfirmed: false,
      gmailConnected: false,
      ordersLoaded: false,
      contactCount: 0,
      ruleCount: 0,
      pendingMemoryCount: 0,
      reviewConfirmed: false,
      activated: false,
    });

    expect(progress.stageStates).toEqual({
      brief: "current",
      sources: "locked",
      learn: "locked",
      review: "locked",
      activate: "locked",
    });
    expect(firstIncompleteStage(progress)).toBe("brief");
  });

  it("opens the next stage as each requirement is met", () => {
    const progress = deriveSetupProgress({
      briefConfirmed: true,
      gmailConnected: true,
      ordersLoaded: true,
      contactCount: 1,
      ruleCount: 1,
      pendingMemoryCount: 0,
      reviewConfirmed: true,
      activated: false,
    });

    expect(progress.stageStates).toEqual({
      brief: "done",
      sources: "done",
      learn: "done",
      review: "done",
      activate: "current",
    });
    expect(firstIncompleteStage(progress)).toBe("activate");
  });

  it("lets the flow continue without Shopify when CSV orders are loaded", () => {
    const progress = deriveSetupProgress({
      briefConfirmed: true,
      gmailConnected: true,
      ordersLoaded: true,
      contactCount: 1,
      ruleCount: 1,
      pendingMemoryCount: 0,
      reviewConfirmed: true,
      activated: false,
    });

    expect(progress.sourcesDone).toBe(true);
    expect(progress.stageStates.sources).toBe("done");
    expect(progress.stageStates.learn).toBe("done");
    expect(firstIncompleteStage(progress)).toBe("activate");
  });

  it("does not mark review done while memory proposals are pending", () => {
    const progress = deriveSetupProgress({
      briefConfirmed: true,
      gmailConnected: true,
      ordersLoaded: true,
      contactCount: 1,
      ruleCount: 1,
      pendingMemoryCount: 2,
      reviewConfirmed: true,
      activated: true,
    });

    expect(progress.reviewDone).toBe(false);
    expect(progress.activated).toBe(false);
    expect(progress.stageStates.review).toBe("current");
    expect(progress.stageStates.activate).toBe("locked");
  });

  it("keeps the default mode ready for the brief step", () => {
    expect(defaultSetupDraft.mode).toBe("approval");
  });

  it("reopens the activation step after setup is complete", () => {
    const progress = deriveSetupProgress({
      briefConfirmed: true,
      gmailConnected: true,
      ordersLoaded: true,
      contactCount: 1,
      ruleCount: 1,
      pendingMemoryCount: 0,
      reviewConfirmed: true,
      activated: true,
    });

    expect(visibleSetupStage(progress, null)).toBe("activate");
    expect(visibleSetupStage(progress, "brief")).toBe("brief");
  });
});
