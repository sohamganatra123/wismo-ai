# WISMO 100-case eval

This eval checks deterministic safety decisions across 100 synthetic cases. It has ten categories with ten variants each:

- matched orders
- unknown customers
- ambiguous orders
- tracking conflicts
- missing packages after delivery
- unrelated emails
- empty messages
- unclear delivery questions
- provider failures
- approved retries

Run it locally with:

```bash
npm run eval -- --reporter=verbose
```

To write the same JSON report used by CI:

```bash
WISMO_EVAL_REPORT=artifacts/wismo-eval-report.json npm run eval
```

The report includes the case count, pass/fail totals, expected pass/review/stop counts, pass rate, category totals, and bounded failure reasons. It does not include raw customer text or model reasoning.

GitHub Actions runs the eval on every pull request and every push to `main`, before lint, type checking, and the production build. The JSON report is retained as a workflow artifact for 30 days.

This is a regression and safety-policy eval, not a production accuracy measurement. A 100% result means the checked deterministic expectations match the current code; it does not mean the live agent is correct on every customer conversation.
