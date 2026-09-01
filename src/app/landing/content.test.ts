import { describe, expect, it } from "vitest";
import { landingContent } from "./content";

describe("landing content", () => {
  it("names autonomous resolution without hiding the safety gate", () => {
    expect(landingContent.hero.eyebrow).toContain("AUTONOMOUS");
    expect(landingContent.hero.body).toContain("safety gate");
    expect(landingContent.hero.body).toContain("manager approval");
  });

  it("offers connection and login routes", () => {
    expect(landingContent.hero.cta.href).toBe("/connect");
    expect(landingContent.hero.secondaryCta.href).toBe("/login");
  });

  it("shows the whole autonomous WISMO journey and honest test result", () => {
    expect(landingContent.journeySteps.map((step) => step.label)).toEqual([
      "RECEIVE", "SCAN", "CHECK COURIER", "REPLY", "RESOLVE",
    ]);
    expect(landingContent.proof.results.filter((result) => result === "PASSED")).toHaveLength(6);
    expect(landingContent.proof.results.filter((result) => result === "REVIEWED")).toHaveLength(2);
    expect(landingContent.proof.results.filter((result) => result === "STOPPED")).toHaveLength(2);
  });
});
