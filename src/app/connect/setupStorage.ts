import { defaultSetupDraft, type SetupDraft } from "./setupJourney";

export const SETUP_STORAGE_KEY = "wismo:setup:v1";

export function loadSetupDraft(): SetupDraft {
  if (typeof window === "undefined") return defaultSetupDraft;

  try {
    const raw = window.localStorage.getItem(SETUP_STORAGE_KEY);
    if (!raw) return defaultSetupDraft;
    const parsed = JSON.parse(raw) as { version?: number; state?: Partial<SetupDraft> };
    if (parsed.version !== 1 || !parsed.state) return defaultSetupDraft;

    const mode = parsed.state.mode;
    const safeMode = mode === "investigate" || mode === "approval" || mode === "verified"
      ? mode
      : defaultSetupDraft.mode;

    return {
      mode: safeMode,
      briefConfirmed: parsed.state.briefConfirmed === true,
      reviewConfirmed: parsed.state.reviewConfirmed === true,
      activated: parsed.state.activated === true,
    };
  } catch {
    return defaultSetupDraft;
  }
}

export function saveSetupDraft(state: SetupDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SETUP_STORAGE_KEY,
    JSON.stringify({ version: 1, state }),
  );
}
