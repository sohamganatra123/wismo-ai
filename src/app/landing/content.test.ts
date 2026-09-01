import { describe, expect, it } from "vitest";
import { landingContent } from "./content";

describe("landing content", () => {
  it("names autonomous resolution without hiding the safety gate", () => {
    expect(landingContent.hero.eyebrow).toContain("AUTONOMOUS");
    expect(landingContent.hero.body).toContain("safety gate");
    expect(landingContent.hero.body).toContain("manager approval");
  });

  it("offers honest early-access and login routes", () => {
    expect(landingContent.hero.cta.href).toBe("/connect");
    expect(landingContent.hero.cta.label).toBe("Join early access");
    expect(landingContent.finalCta.cta.label).toBe("Join early access");
    expect(landingContent.hero.secondaryCta.href).toBe("/login");
  });

  it("uses an honest early-access handoff on the public landing page", () => {
    const landingCopy = JSON.stringify(landingContent).toLowerCase();

    expect(landingContent.hero.note).toContain("Early access");
    expect(landingContent.finalCta.note).toContain("work email");
    expect(landingCopy).not.toContain("setup takes about 5 minutes");
    expect(landingCopy).not.toContain("simulation");
  });

  it("shows the whole autonomous WISMO journey and honest test result", () => {
    expect(landingContent.journeySteps.map((step) => step.label)).toEqual([
      "RECEIVE", "SCAN", "CHECK COURIER", "REPLY", "RESOLVE",
    ]);
    expect(landingContent.proof.results.filter((result) => result === "PASSED")).toHaveLength(6);
    expect(landingContent.proof.results.filter((result) => result === "REVIEWED")).toHaveLength(2);
    expect(landingContent.proof.results.filter((result) => result === "STOPPED")).toHaveLength(2);
  });

  it("answers the six concrete trust questions without overstating the pilot", () => {
    expect(landingContent.trust.items).toHaveLength(6);
    expect(landingContent.trust.items.map((item) => item.label)).toEqual([
      "Data Wismo can access",
      "Actions that need approval",
      "How incorrect replies are stopped",
      "How data is used",
      "How access is revoked",
      "What the first test showed",
    ]);
    expect(landingContent.trust.items.at(-1)?.body).toContain("6 passed");
    expect(landingContent.trust.items.at(-1)?.body).toContain("not a production accuracy claim");
  });

  it("sets expectations after signup and includes practical FAQs", () => {
    expect(landingContent.nextSteps.steps).toHaveLength(3);
    expect(landingContent.nextSteps.steps[0].body).toContain("work email");
    expect(landingContent.faq.items.length).toBeGreaterThanOrEqual(5);
    expect(landingContent.faq.items.some((item) => item.question.includes("train"))).toBe(true);
    expect(landingContent.faq.items.some((item) => item.question.includes("disconnect"))).toBe(true);
  });
});
