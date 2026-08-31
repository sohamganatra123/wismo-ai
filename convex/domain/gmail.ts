export type GmailPart = { mimeType?: string; body?: { data?: string }; parts?: GmailPart[] };
export type GmailPayload = {
  id?: string; threadId?: string; internalDate?: string; labelIds?: string[];
  payload?: GmailPart & { headers?: Array<{ name?: string; value?: string }> };
};

function decode(value?: string) {
  if (!value) return "";
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function body(part?: GmailPart): { plain: string[]; html: string[] } {
  const result = { plain: [] as string[], html: [] as string[] };
  if (!part) return result;
  const text = decode(part.body?.data);
  if (text && part.mimeType === "text/plain") result.plain.push(text);
  if (text && part.mimeType === "text/html") result.html.push(text);
  for (const child of part.parts ?? []) {
    const nested = body(child);
    result.plain.push(...nested.plain); result.html.push(...nested.html);
  }
  return result;
}

function stripHtml(value: string) {
  return value.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
}

export function normalizeGmailMessage(message: GmailPayload) {
  if (!message.id || !message.threadId) throw new Error("Gmail message is missing its ID or thread ID");
  const headers = new Map((message.payload?.headers ?? []).map((header) => [header.name?.toLowerCase() ?? "", header.value ?? ""]));
  const content = body(message.payload);
  const text = content.plain.join("\n").trim() || stripHtml(content.html.join("\n"));
  return {
    providerId: message.id, threadId: message.threadId,
    from: headers.get("from") ?? "Unknown sender",
    to: (headers.get("to") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
    subject: headers.get("subject") ?? "(no subject)", text,
    sentAt: Number(message.internalDate ?? Date.now()),
    hasAttachments: JSON.stringify(message.payload ?? {}).includes('"filename"'),
    labelIds: message.labelIds ?? [],
  };
}
