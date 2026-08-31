import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeStore, connectGmail, connectShopify, runTestOrder } from "./simulatedConnections";

describe("simulated onboarding adapters", () => {
  afterEach(() => vi.useRealTimers());

  it("normalizes the simulated connections", async () => {
    vi.useFakeTimers();
    const gmail = connectGmail("avery@example.com");
    const shopify = connectShopify("Northstar-Goods");
    const voice = analyzeStore();
    await vi.runAllTimersAsync();
    await expect(gmail).resolves.toEqual({ email: "avery@example.com" });
    await expect(shopify).resolves.toEqual({ domain: "northstar-goods.myshopify.com" });
    await expect(voice).resolves.toMatchObject({ storeName: "Northstar Goods" });
  });

  it("emits the proof stages in order", async () => {
    vi.useFakeTimers();
    const events: string[] = [];
    const run = runTestOrder((status) => events.push(status));
    await vi.runAllTimersAsync();
    await run;
    expect(events).toEqual(["sending", "received", "checking", "prepared"]);
  });
});
