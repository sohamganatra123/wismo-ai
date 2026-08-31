import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { decryptCredentials } from "./security/credentials";
import { normalizeGmailMessage, type GmailPayload } from "./domain/gmail";

type Tokens = { access_token?: string; refresh_token?: string };
function required(name: string) { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value; }

async function accessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: required("GOOGLE_CLIENT_ID"), client_secret: required("GOOGLE_CLIENT_SECRET"), refresh_token: refreshToken, grant_type: "refresh_token" }) });
  const body = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) throw new Error(body.error_description ?? "Could not refresh Gmail access");
  return body.access_token;
}

async function poll(ctx: ActionCtx) {
  const connection = await ctx.runQuery(internal.gmailData.getConnection, {});
  if (!connection?.cursor) return { created: 0, checked: 0, status: "not_connected" as const };
  const tokens = await decryptCredentials<Tokens>(connection.encryptedCredentials, required("INTEGRATION_ENCRYPTION_KEY"));
  if (!tokens.refresh_token) throw new Error("Reconnect Gmail to grant offline access");
  const token = await accessToken(tokens.refresh_token);
  let pageToken: string | undefined; let latestCursor = connection.cursor; const ids = new Set<string>();
  do {
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/history"); url.searchParams.set("startHistoryId", connection.cursor); url.searchParams.set("historyTypes", "messageAdded"); if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 404) { const profile = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: { Authorization: `Bearer ${token}` } }).then((item) => item.json()) as { historyId: string }; await ctx.runMutation(internal.gmailData.advanceCursor, { integrationId: connection._id, cursor: profile.historyId }); return { created: 0, checked: 0, status: "cursor_reset" as const }; }
    const history = await response.json() as { historyId?: string; nextPageToken?: string; history?: Array<{ messagesAdded?: Array<{ message?: { id?: string } }> }> };
    if (!response.ok) throw new Error("Gmail history poll failed");
    for (const event of history.history ?? []) for (const added of event.messagesAdded ?? []) if (added.message?.id) ids.add(added.message.id);
    latestCursor = history.historyId ?? latestCursor; pageToken = history.nextPageToken;
  } while (pageToken);
  let created = 0;
  for (const id of ids) {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) continue;
    const message = normalizeGmailMessage(await response.json() as GmailPayload); if (!message.labelIds.includes("INBOX")) continue;
    const result = await ctx.runMutation(internal.gmailData.ingest, { providerId: message.providerId, threadId: message.threadId, from: message.from, to: message.to, subject: message.subject, text: message.text, hasAttachments: message.hasAttachments, sentAt: message.sentAt });
    if (result.created) created += 1;
  }
  await ctx.runMutation(internal.gmailData.advanceCursor, { integrationId: connection._id, cursor: latestCursor });
  return { created, checked: ids.size, status: "ok" as const };
}

export const pollInbox = internalAction({ args: {}, handler: poll });
export const pollNow = action({ args: {}, handler: async (ctx) => { const userId = await getAuthUserId(ctx); if (!userId || !(await ctx.runQuery(internal.gmailData.isFounder, { userId }))) throw new Error("Founder access required"); return poll(ctx); } });
