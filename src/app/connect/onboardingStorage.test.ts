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

  it("round-trips safe progress without a password", async () => {
    const { loadOnboarding, saveOnboarding } = await import("./onboardingStorage");
    const state = { ...initialOnboardingState, step: "gmail" as const, name: "Avery", email: "avery@example.com" };
    saveOnboarding(state);
    expect([...values.values()][0]).not.toContain("password");
    expect(loadOnboarding()).toEqual(state);
  });

  it("falls back when stored data is malformed", async () => {
    const { loadOnboarding, ONBOARDING_STORAGE_KEY } = await import("./onboardingStorage");
    values.set(ONBOARDING_STORAGE_KEY, JSON.stringify({ version: 2, state: { step: "unknown" } }));
    expect(loadOnboarding()).toEqual(initialOnboardingState);
  });
});
