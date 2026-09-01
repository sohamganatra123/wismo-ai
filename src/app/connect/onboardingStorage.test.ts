import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialOnboardingState } from "./onboardingTypes";

const values = new Map<string, string>();
vi.stubGlobal("window", { localStorage: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
} });

describe("onboardingStorage", () => {
  beforeEach(() => values.clear());

  it("round-trips safe progress and control mode without a password", async () => {
    const { loadOnboarding, saveOnboarding } = await import("./onboardingStorage");
    const state = { ...initialOnboardingState, step: "gmail" as const, name: "Avery", email: "avery@example.com", autonomyMode: "verified" as const };
    saveOnboarding(state);
    expect([...values.values()][0]).not.toContain("password");
    expect(loadOnboarding()).toEqual(state);
  });

  it("migrates valid v2 progress to the approval control mode", async () => {
    const { loadOnboarding } = await import("./onboardingStorage");
    values.set("wismo:onboarding:v2", JSON.stringify({
      version: 2,
      state: { ...initialOnboardingState, autonomyMode: undefined, step: "gmail", name: "Avery", email: "avery@example.com" },
    }));
    expect(loadOnboarding()).toMatchObject({ step: "gmail", autonomyMode: "approval" });
  });

  it("falls back when stored data is malformed", async () => {
    const { loadOnboarding, ONBOARDING_STORAGE_KEY } = await import("./onboardingStorage");
    values.set(ONBOARDING_STORAGE_KEY, JSON.stringify({ version: 3, state: { step: "unknown" } }));
    expect(loadOnboarding()).toEqual(initialOnboardingState);
  });
});
