import { describe, expect, it } from "vitest";
import { normalizeGmailMessage, type GmailPayload } from "./gmail";

const encoded = (value: string) => Buffer.from(value).toString("base64url");
const base: GmailPayload = { id: "m-1", threadId: "t-1", internalDate: "1000", labelIds: ["INBOX"], payload: { headers: [{ name: "From", value: "Amina <amina@example.com>" }, { name: "To", value: "help@example.com" }, { name: "Subject", value: "Where is order 4921?" }] } };

describe("Gmail normalization", () => {
  it("keeps IDs, headers, timestamp, and plain text", () => {
    const result = normalizeGmailMessage({ ...base, payload: { ...base.payload, mimeType: "text/plain", body: { data: encoded("Original email text") } } });
    expect(result).toMatchObject({ providerId: "m-1", threadId: "t-1", from: "Amina <amina@example.com>", subject: "Where is order 4921?", text: "Original email text", sentAt: 1000 });
  });
  it("prefers nested plain text over HTML", () => {
    const result = normalizeGmailMessage({ ...base, payload: { ...base.payload, mimeType: "multipart/alternative", parts: [{ mimeType: "text/html", body: { data: encoded("<p>HTML copy</p>") } }, { mimeType: "text/plain", body: { data: encoded("Plain copy") } }] } });
    expect(result.text).toBe("Plain copy");
  });
  it("uses readable HTML when plain text is absent", () => {
    const result = normalizeGmailMessage({ ...base, payload: { ...base.payload, mimeType: "text/html", body: { data: encoded("<p>Hello<br>there &amp; thanks</p>") } } });
    expect(result.text).toContain("Hello\nthere & thanks");
  });
  it("uses safe header defaults", () => {
    expect(normalizeGmailMessage({ id: "m", threadId: "t", payload: {} })).toMatchObject({ from: "Unknown sender", subject: "(no subject)", to: [] });
  });
});
