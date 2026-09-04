export const ORDER_HEADERS = [
  "order_id",
  "customer_email",
  "customer_name",
  "status",
  "tracking_number",
  "carrier",
  "status_updated_at",
  "line_items",
] as const;

export type OrderRecord = {
  orderId: string;
  customerEmail: string;
  customerName: string;
  status: string;
  trackingNumber?: string;
  carrier?: string;
  statusUpdatedAt: string;
  lineItems: string[];
};

export type OrdersParseResult =
  | { ok: true; orders: OrderRecord[] }
  | { ok: false; errors: string[] };

function rowsFromCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("A quoted cell is not closed.");
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMULA = /^[=+\-@]/;

export function parseOrdersCsv(text: string): OrdersParseResult {
  if (new Blob([text]).size > 5 * 1024 * 1024) {
    return { ok: false, errors: ["The file is larger than 5 MB."] };
  }
  let rows: string[][];
  try {
    rows = rowsFromCsv(text.replace(/^\uFEFF/, ""));
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : "The CSV could not be read."] };
  }
  if (rows.length === 0) return { ok: false, errors: ["The file is empty."] };
  if (rows.length > 10_001) return { ok: false, errors: ["The file contains more than 10,000 orders."] };
  const header = rows[0].map((value) => value.trim().toLowerCase());
  if (header.join(",") !== ORDER_HEADERS.join(",")) {
    return { ok: false, errors: [`Use this exact header: ${ORDER_HEADERS.join(",")}`] };
  }

  const errors: string[] = [];
  const seen = new Set<string>();
  const orders = rows.slice(1).flatMap((values, index) => {
    const line = index + 2;
    if (values.length !== ORDER_HEADERS.length) {
      errors.push(`Row ${line}: expected ${ORDER_HEADERS.length} columns.`);
      return [];
    }
    const clean = values.map((value) => value.trim());
    if (clean.some((value) => FORMULA.test(value))) {
      errors.push(`Row ${line}: formula-prefixed cells are not allowed.`);
      return [];
    }
    const [orderId, email, customerName, status, trackingNumber, carrier, statusUpdatedAt, lineItems] = clean;
    if (!orderId || !email || !status || !statusUpdatedAt) {
      errors.push(`Row ${line}: order ID, email, status, and updated time are required.`);
      return [];
    }
    const normalizedId = orderId.replace(/^#/, "").toUpperCase();
    if (seen.has(normalizedId)) {
      errors.push(`Row ${line}: order ${orderId} appears more than once.`);
      return [];
    }
    seen.add(normalizedId);
    if (!EMAIL.test(email)) {
      errors.push(`Row ${line}: ${email} is not a valid email address.`);
      return [];
    }
    if (!Number.isFinite(Date.parse(statusUpdatedAt))) {
      errors.push(`Row ${line}: status_updated_at must be an ISO date and time.`);
      return [];
    }
    return [{
      orderId: normalizedId,
      customerEmail: email.toLowerCase(),
      customerName: customerName || email.split("@")[0],
      status,
      trackingNumber: trackingNumber || undefined,
      carrier: carrier || undefined,
      statusUpdatedAt,
      lineItems: lineItems ? lineItems.split("|").map((item) => item.trim()).filter(Boolean) : [],
    } satisfies OrderRecord];
  });
  if (rows.length === 1) errors.push("The file has a header but no orders.");
  return errors.length ? { ok: false, errors: errors.slice(0, 12) } : { ok: true, orders };
}

export function sampleOrdersCsv(now = new Date()) {
  const fresh = now.toISOString();
  return `${ORDER_HEADERS.join(",")}\n4921,amina@example.com,Amina Yusuf,out for delivery,TRK-4921,DHL,${fresh},Canvas backpack\n7814,leo@example.com,Leo Martin,in transit,TRK-7814,DPD,${fresh},Running shoes\n7815,leo@example.com,Leo Martin,label created,TRK-7815,DPD,${fresh},Sports socks`;
}
