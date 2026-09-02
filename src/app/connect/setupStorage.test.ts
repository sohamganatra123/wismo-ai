import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSetupDraft } from "./setupJourney";

const values = new Map<string, string>();

vi.stubGlobal("window", {
  localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});

describe("setupStorage", () => {
  beforeEach(() => values.clear());

  it("round-trips saved draft state", async () => {
    const { loadSetupDraft, saveSetupDraft, SETUP_STORAGE_KEY } = await import("./setupStorage");
    saveSetupDraft({
      mode: "verified",
      briefConfirmed: true,
      reviewConfirmed: false,
      activated: false,
    });

    expect(values.get(SETUP_STORAGE_KEY)).toContain("\"verified\"");
    expect(loadSetupDraft()).toEqual({
      mode: "verified",
      briefConfirmed: true,
      reviewConfirmed: false,
      activated: false,
    });
  });

  it("falls back when stored mode is invalid", async () => {
    const { loadSetupDraft, SETUP_STORAGE_KEY } = await import("./setupStorage");
    values.set(SETUP_STORAGE_KEY, JSON.stringify({
      version: 1,
      state: { ...defaultSetupDraft, mode: "bad-mode" },
    }));

    expect(loadSetupDraft()).toEqual(defaultSetupDraft);
  });

  it("falls back when stored data is malformed", async () => {
    const { loadSetupDraft, SETUP_STORAGE_KEY } = await import("./setupStorage");
    values.set(SETUP_STORAGE_KEY, "{bad json");
    expect(loadSetupDraft()).toEqual(defaultSetupDraft);
  });
});
