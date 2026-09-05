import { describe, expect, it } from "vitest";
import { runWismoEval, wismoEvalCases, writeWismoEvalReport } from "./wismoEval";

if (process.env.WISMO_EVAL_REPORT) {
  writeWismoEvalReport(process.env.WISMO_EVAL_REPORT);
}

describe("WISMO 100-case safety eval", () => {
  it("contains exactly 100 cases across ten categories", () => {
    expect(wismoEvalCases).toHaveLength(100);
    expect(new Set(wismoEvalCases.map((testCase) => testCase.category)).size).toBe(10);
    expect(Object.values(runWismoEval().categories).every((category) => category.total === 10)).toBe(true);
  });

  it("passes every deterministic safety expectation", () => {
    const report = runWismoEval();
    expect(report).toMatchObject({ total: 100, passed: 100, failed: 0, passRate: 1 });
    expect(report.expectedOutcomeCounts).toEqual({ pass: 20, review: 40, stop: 40 });
  });

  it("fails when a review case is given permission to send externally", () => {
    const [reviewCase] = wismoEvalCases.filter((testCase) => testCase.expectedOutcome === "review");
    const report = runWismoEval([{ ...reviewCase, action: { ...reviewCase.action, approvalStatus: "approved" } }]);
    expect(report.failed).toBe(1);
  });

  it("writes a report without raw case text", () => {
    const reportPath = "/tmp/wismo-eval-report-test.json";
    writeWismoEvalReport(reportPath, runWismoEval(wismoEvalCases.slice(0, 1)));
    expect(reportPath).toContain("wismo-eval-report-test.json");
  });
});
