import { describe, expect, it } from "vitest";
import { onboardingReducer } from "./onboardingReducer";
import { initialOnboardingState } from "./onboardingTypes";
import { seededVoice } from "./simulatedConnections";

function throughShopify() {
  let state = onboardingReducer(initialOnboardingState, { type: "ACCOUNT_COMPLETED", name: "Avery", email: "avery@example.com" });
  state = onboardingReducer(state, { type: "GMAIL_CONNECT_STARTED" });
  state = onboardingReducer(state, { type: "GMAIL_CONNECTED" });
  state = onboardingReducer(state, { type: "SHOPIFY_CONNECT_STARTED", domain: "northstar-goods.myshopify.com" });
  return onboardingReducer(state, { type: "SHOPIFY_CONNECTED", domain: "northstar-goods.myshopify.com", voice: seededVoice });
}

describe("onboardingReducer", () => {
  it("enforces account, Gmail, Shopify, voice, test, then launch", () => {
    let state = initialOnboardingState;
    expect(state.step).toBe("account");
    state = onboardingReducer(state, { type: "GMAIL_CONNECTED" });
    expect(state.step).toBe("account");
    state = onboardingReducer(state, { type: "ACCOUNT_COMPLETED", name: "Avery", email: "avery@example.com" });
    expect(state.step).toBe("gmail");
    state = onboardingReducer(state, { type: "GMAIL_CONNECTED" });
    expect(state.step).toBe("shopify");
    state = onboardingReducer(state, { type: "SHOPIFY_CONNECTED", domain: "store.myshopify.com", voice: seededVoice });
    expect(state.step).toBe("shopify");
  });

  it("reaches launch only after voice acceptance and prepared proof", () => {
    let state = throughShopify();
    expect(state.step).toBe("voice");
    state = onboardingReducer(state, { type: "TEST_STARTED" });
    expect(state.testStatus).toBe("idle");
    state = onboardingReducer(state, { type: "VOICE_ACCEPTED" });
    state = onboardingReducer(state, { type: "TEST_STARTED" });
    for (const status of ["received", "checking", "prepared"] as const) state = onboardingReducer(state, { type: "TEST_ADVANCED", status });
    expect(state.step).toBe("launch");
    expect(onboardingReducer(state, { type: "AUTOMATION_ACTIVATED" }).active).toBe(true);
  });

  it("changing Gmail clears only the proof while changing Shopify clears voice and proof", () => {
    let state = { ...throughShopify(), voiceAccepted: true, testStatus: "prepared" as const, active: true };
    state = onboardingReducer(state, { type: "GO_BACK", step: "gmail" });
    state = onboardingReducer(state, { type: "GMAIL_CONNECT_STARTED" });
    expect(state.testStatus).toBe("idle");
    expect(state.voice).toEqual(seededVoice);
    state = onboardingReducer(state, { type: "GMAIL_CONNECTED" });
    state = onboardingReducer(state, { type: "SHOPIFY_CONNECT_STARTED", domain: "another.myshopify.com" });
    expect(state.voice).toBeNull();
    expect(state.voiceAccepted).toBe(false);
  });

  it("does not navigate ahead of completed prerequisites", () => {
    expect(onboardingReducer(initialOnboardingState, { type: "GO_BACK", step: "launch" }).step).toBe("account");
  });
});
