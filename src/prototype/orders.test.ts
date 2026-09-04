import { describe, expect, it } from "vitest";
import { parseOrdersCsv, sampleOrdersCsv } from "./orders";

describe("orders CSV", () => {
  it("parses the prototype sample", () => {
    const result = parseOrdersCsv(sampleOrdersCsv(new Date("2026-09-04T12:00:00Z")));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.orders).toHaveLength(3);
  });

  it("rejects duplicate orders and formula cells", () => {
    const csv = sampleOrdersCsv().replace("7815,leo", "4921,=leo");
    const result = parseOrdersCsv(csv);
    expect(result.ok).toBe(false);
  });

  it("requires the exact header", () => {
    const result = parseOrdersCsv("order,email\n1,a@example.com");
    expect(result).toMatchObject({ ok: false });
  });
});
