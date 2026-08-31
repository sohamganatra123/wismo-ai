import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { encryptCredentials } from "./security/credentials";
import { action, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify";

async function sha256(value: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export const beginGmailConnection = action({
  args: {},
  handler: async (ctx) => {
    const state = crypto.randomUUID() + crypto.randomUUID();
    const stateHash = await sha256(state);
    await ctx.runMutation(internal.integrationData.createOAuthState, { stateHash, expiresAt: Date.now() + 10 * 60 * 1000 });
    const callback = `${required("CONVEX_SITE_URL")}/gmail/oauth/callback`;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({ client_id: required("GOOGLE_CLIENT_ID"), redirect_uri: callback, response_type: "code", scope: GMAIL_SCOPE, access_type: "offline", include_granted_scopes: "true", prompt: "consent", state }).toString();
    return url.toString();
  },
});

export const connectShopify = action({
  args: { shopDomain: v.string(), accessToken: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    const domain = args.shopDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) throw new Error("Use the store's .myshopify.com domain");
    const response = await fetch(`https://${domain}/admin/api/${required("SHOPIFY_API_VERSION")}/graphql.json`, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": args.accessToken }, body: JSON.stringify({ query: "query WismoConnectionCheck { shop { name myshopifyDomain } }" }) });
    const body = await response.json() as { data?: { shop?: { name: string; myshopifyDomain: string } }; errors?: unknown };
    if (!response.ok || !body.data?.shop || body.errors) throw new Error("Shopify rejected this store or token");
    const encryptedCredentials = await encryptCredentials({ accessToken: args.accessToken }, required("INTEGRATION_ENCRYPTION_KEY"));
    await ctx.runMutation(internal.integrationData.saveIntegration, { kind: "shopify", accountLabel: body.data.shop.myshopifyDomain, encryptedCredentials, connectedBy: userId });
    return { accountLabel: body.data.shop.myshopifyDomain, storeName: body.data.shop.name };
  },
});

export const gmailOAuthCallback = httpAction(async (ctx, request) => {
  const siteUrl = required("SITE_URL");
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) throw new Error("Google did not return a connection code");
    const stateHash = await sha256(state);
    const { userId } = await ctx.runMutation(internal.integrationData.consumeOAuthState, { stateHash });
    const redirectUri = `${required("CONVEX_SITE_URL")}/gmail/oauth/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: required("GOOGLE_CLIENT_ID"), client_secret: required("GOOGLE_CLIENT_SECRET"), redirect_uri: redirectUri, grant_type: "authorization_code" }) });
    const tokens = await tokenResponse.json() as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; error?: string };
    if (!tokenResponse.ok || !tokens.access_token || !tokens.refresh_token) throw new Error(tokens.error ?? "Google token exchange failed");
    const profileResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const profile = await profileResponse.json() as { emailAddress?: string };
    if (!profileResponse.ok || !profile.emailAddress) throw new Error("Could not read the connected Gmail account");
    const encryptedCredentials = await encryptCredentials(tokens, required("INTEGRATION_ENCRYPTION_KEY"));
    await ctx.runMutation(internal.integrationData.saveIntegration, { kind: "gmail", accountLabel: profile.emailAddress, encryptedCredentials, connectedBy: userId });
    return Response.redirect(`${siteUrl}/connect?gmail=connected`, 302);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail connection failed";
    return Response.redirect(`${siteUrl}/connect?gmail=error&reason=${encodeURIComponent(message)}`, 302);
  }
});
