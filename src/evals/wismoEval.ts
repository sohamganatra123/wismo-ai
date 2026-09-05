import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { classifyInboundEmail, type InboundClassification } from "../../convex/domain/inboundClassification";
import { canExecuteExternalAction, type ApprovalStatus, type ExternalActionKind } from "../../convex/domain/approvals";

export type EvalOutcome = "pass" | "review" | "stop" | "fail";
export type WismoEvalCase = {
  id: string;
  category: string;
  subject: string;
  text: string;
  expectedClassification: InboundClassification;
  expectedOutcome: Exclude<EvalOutcome, "fail">;
  action: { kind: ExternalActionKind; approvalStatus: ApprovalStatus; alreadyExecuted: boolean };
};

const variants = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];

const categoryTemplates: Array<Omit<WismoEvalCase, "id" | "text"> & { text: (variant: string) => string }> = [
  { category: "matched-order", subject: "Where is my order?", text: (v) => `Please send a delivery update for my ${v} order.`, expectedClassification: "wismo", expectedOutcome: "pass", action: { kind: "customer_email", approvalStatus: "approved", alreadyExecuted: false } },
  { category: "unknown-customer", subject: "Tracking update", text: (v) => `Can you locate my ${v} package? I cannot find the order email.`, expectedClassification: "wismo", expectedOutcome: "review", action: { kind: "customer_email", approvalStatus: "pending", alreadyExecuted: false } },
  { category: "ambiguous-order", subject: "Which order is this?", text: (v) => `I have two recent ${v} orders. Which one is arriving today?`, expectedClassification: "wismo", expectedOutcome: "review", action: { kind: "customer_email", approvalStatus: "pending", alreadyExecuted: false } },
  { category: "tracking-conflict", subject: "Tracking changed", text: (v) => `The ${v} tracking page says delivered, but the courier says it is still in transit.`, expectedClassification: "wismo", expectedOutcome: "stop", action: { kind: "customer_email", approvalStatus: "pending", alreadyExecuted: false } },
  { category: "missing-after-delivery", subject: "Package missing", text: (v) => `My ${v} parcel says delivered but it is not here.`, expectedClassification: "wismo", expectedOutcome: "review", action: { kind: "customer_email", approvalStatus: "pending", alreadyExecuted: false } },
  { category: "unrelated-email", subject: "Wholesale question", text: (v) => `Can you tell me about your ${v} wholesale catalogue?`, expectedClassification: "unrelated", expectedOutcome: "stop", action: { kind: "customer_email", approvalStatus: "pending", alreadyExecuted: false } },
  { category: "empty-message", subject: "(no subject)", text: () => "", expectedClassification: "clarification", expectedOutcome: "stop", action: { kind: "customer_email", approvalStatus: "pending", alreadyExecuted: false } },
  { category: "unclear-delivery", subject: "Hello", text: (v) => `Hello, I have a question about my ${v} order.`, expectedClassification: "clarification", expectedOutcome: "review", action: { kind: "customer_email", approvalStatus: "pending", alreadyExecuted: false } },
  { category: "provider-failure", subject: "Where is my shipment?", text: (v) => `Please check the ${v} shipment; the store system is unavailable.`, expectedClassification: "wismo", expectedOutcome: "stop", action: { kind: "customer_email", approvalStatus: "pending", alreadyExecuted: false } },
  { category: "approved-retry", subject: "Please update me", text: (v) => `My ${v} parcel is late. Send the approved status update.`, expectedClassification: "wismo", expectedOutcome: "pass", action: { kind: "customer_email", approvalStatus: "approved", alreadyExecuted: false } },
];

export const wismoEvalCases: WismoEvalCase[] = categoryTemplates.flatMap((template) =>
  variants.map((variant, index) => ({
    id: `WISMO-${String(index + 1).padStart(2, "0")}-${template.category}`,
    category: template.category,
    subject: template.subject,
    text: template.text(variant),
    expectedClassification: template.expectedClassification,
    expectedOutcome: template.expectedOutcome,
    action: template.action,
  })),
);

export function evaluateWismoCase(testCase: WismoEvalCase) {
  const classification = classifyInboundEmail({ subject: testCase.subject, text: testCase.text });
  const externalActionAllowed = canExecuteExternalAction(testCase.action);
  const classificationMatches = classification === testCase.expectedClassification;
  const safeAction = testCase.expectedOutcome === "pass" ? externalActionAllowed : !externalActionAllowed;
  return {
    id: testCase.id,
    category: testCase.category,
    expectedOutcome: testCase.expectedOutcome,
    classification,
    passed: classificationMatches && safeAction,
    failureReason: classificationMatches ? safeAction ? null : "unexpected external-action permission" : `expected ${testCase.expectedClassification}, got ${classification}`,
  };
}

export type WismoEvalReport = {
  generatedAt: string;
  total: number;
  passed: number;
  failed: number;
  expectedOutcomeCounts: Record<Exclude<EvalOutcome, "fail">, number>;
  passRate: number;
  categories: Record<string, { total: number; passed: number; failed: number }>;
  results: ReturnType<typeof evaluateWismoCase>[];
};

export function runWismoEval(cases = wismoEvalCases): WismoEvalReport {
  const results = cases.map(evaluateWismoCase);
  const categories: WismoEvalReport["categories"] = {};
  for (const result of results) {
    const category = categories[result.category] ?? { total: 0, passed: 0, failed: 0 };
    category.total += 1;
    if (result.passed) category.passed += 1;
    else category.failed += 1;
    categories[result.category] = category;
  }
  const expectedOutcomeCounts = { pass: 0, review: 0, stop: 0 };
  for (const testCase of cases) expectedOutcomeCounts[testCase.expectedOutcome] += 1;
  const passed = results.filter((result) => result.passed).length;
  return {
    generatedAt: new Date().toISOString(),
    total: results.length,
    passed,
    failed: results.length - passed,
    expectedOutcomeCounts,
    passRate: results.length === 0 ? 0 : passed / results.length,
    categories,
    results,
  };
}

export function writeWismoEvalReport(path: string, report = runWismoEval()) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
