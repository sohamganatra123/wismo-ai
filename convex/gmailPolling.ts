import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { decryptCredentials } from "./security/credentials";
import { normalizeGmailMessage, type GmailPayload } from "./domain/gmail";
import { classifyInboundEmail } from "./domain/inboundClassification";

type Tokens = { access_token?: string; refresh_token?: string };
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function accessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: required("GOOGLE_CLIENT_ID"),
      client_secret: required("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = (await response.json()) as {
    access_token?: string;
    error_description?: string;
  };
  if (!response.ok || !body.access_token)
    throw new Error(body.error_description ?? "Could not refresh Gmail access");
  return body.access_token;
}

const CLARIFICATION_TEXT = `Hi,

I can help with a delivery question, but I need a little more detail. Please reply with your order number and what you would like to know about the delivery.

WISMO`;

function replyAddress(from: string) {
  const bracketed = from.match(/<([^<>\s]+@[^<>\s]+)>/);
  const plain = from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const address = bracketed?.[1] ?? plain?.[0];
  if (!address) throw new Error("The sender has no replyable email address");
  return address;
}

function replySubject(subject: string) {
  const safe = subject.replace(/[\r\n]+/g, " ").trim();
  if (!safe || safe === "(no subject)") return "Re: Delivery question";
  return /^re:/i.test(safe) ? safe : `Re: ${safe}`;
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendClarification(
  token: string,
  message: ReturnType<typeof normalizeGmailMessage>,
) {
  const to = replyAddress(message.from);
  const subject = replySubject(message.subject);
  const reference = message.messageIdHeader.replace(/[\r\n]+/g, "").trim();
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    ...(reference
      ? [`In-Reply-To: ${reference}`, `References: ${reference}`]
      : []),
  ];
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        threadId: message.threadId,
        raw: base64Url(`${headers.join("\r\n")}\r\n\r\n${CLARIFICATION_TEXT}`),
      }),
    },
  );
  const result = (await response.json()) as { id?: string; threadId?: string };
  if (!response.ok || !result.id) {
    throw new Error("Gmail clarification reply failed");
  }
  return {
    providerId: result.id,
    threadId: result.threadId ?? message.threadId,
    to,
    subject,
  };
}

async function poll(ctx: ActionCtx) {
  const connection = await ctx.runQuery(internal.gmailData.getConnection, {});
  if (!connection?.cursor)
    return {
      created: 0,
      clarified: 0,
      ignored: 0,
      checked: 0,
      status: "not_connected" as const,
    };
  const tokens = await decryptCredentials<Tokens>(
    connection.encryptedCredentials,
    required("INTEGRATION_ENCRYPTION_KEY"),
  );
  if (!tokens.refresh_token)
    throw new Error("Reconnect Gmail to grant offline access");
  const token = await accessToken(tokens.refresh_token);
  let pageToken: string | undefined;
  let latestCursor = connection.cursor;
  const ids = new Set<string>();
  do {
    const url = new URL(
      "https://gmail.googleapis.com/gmail/v1/users/me/history",
    );
    url.searchParams.set("startHistoryId", connection.cursor);
    url.searchParams.set("historyTypes", "messageAdded");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 404) {
      const profile = (await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/profile",
        { headers: { Authorization: `Bearer ${token}` } },
      ).then((item) => item.json())) as { historyId: string };
      await ctx.runMutation(internal.gmailData.advanceCursor, {
        integrationId: connection._id,
        cursor: profile.historyId,
      });
      return {
        created: 0,
        clarified: 0,
        ignored: 0,
        checked: 0,
        status: "cursor_reset" as const,
      };
    }
    const history = (await response.json()) as {
      historyId?: string;
      nextPageToken?: string;
      history?: Array<{ messagesAdded?: Array<{ message?: { id?: string } }> }>;
    };
    if (!response.ok) throw new Error("Gmail history poll failed");
    for (const event of history.history ?? [])
      for (const added of event.messagesAdded ?? [])
        if (added.message?.id) ids.add(added.message.id);
    latestCursor = history.historyId ?? latestCursor;
    pageToken = history.nextPageToken;
  } while (pageToken);
  let created = 0;
  let clarified = 0;
  let ignored = 0;
  for (const id of ids) {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) continue;
    const message = normalizeGmailMessage(
      (await response.json()) as GmailPayload,
    );
    if (!message.labelIds.includes("INBOX")) continue;
    const classification = classifyInboundEmail(message);
    const result = await ctx.runMutation(internal.gmailData.prepareInbound, {
      providerId: message.providerId,
      threadId: message.threadId,
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      hasAttachments: message.hasAttachments,
      sentAt: message.sentAt,
      classification,
    });
    if (result.action === "created") created += 1;
    if (result.action === "ignored") ignored += 1;
    if (result.action === "clarification") {
      const sent = await sendClarification(token, message);
      await ctx.runMutation(internal.gmailData.completeClarification, {
        caseId: result.caseId,
        providerId: sent.providerId,
        threadId: sent.threadId,
        from: connection.accountLabel,
        to: sent.to,
        subject: sent.subject,
        text: CLARIFICATION_TEXT,
      });
      clarified += 1;
    }
  }
  await ctx.runMutation(internal.gmailData.advanceCursor, {
    integrationId: connection._id,
    cursor: latestCursor,
  });
  return {
    created,
    clarified,
    ignored,
    checked: ids.size,
    status: "ok" as const,
  };
}

export const pollInbox = internalAction({ args: {}, handler: poll });
export const pollNow = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (
      !userId ||
      !(await ctx.runQuery(internal.gmailData.isFounder, { userId }))
    )
      throw new Error("Founder access required");
    return poll(ctx);
  },
});
