import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { parseShopifyCustomer } from "./domain/shopifyCustomer";
import { decryptCredentials } from "./security/credentials";

type ShopifyCredentials = { accessToken: string };

const CUSTOMER_QUERY = `query WismoCustomerMatch($identifier: CustomerIdentifierInput!) {
  customerByIdentifier(identifier: $identifier) {
    id
    displayName
    defaultEmailAddress { emailAddress }
    orders(first: 10, reverse: true, query: "status:open") {
      nodes {
        id
        name
        createdAt
        displayFulfillmentStatus
        lineItems(first: 10) { nodes { name } }
        fulfillments(first: 10) {
          displayStatus
          trackingInfo(first: 10) { number url }
        }
      }
    }
  }
}`;

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function senderEmail(from: string) {
  return from
    .match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
    ?.toLowerCase();
}

export const matchCase = internalAction({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const input = await ctx.runQuery(internal.shopifyData.getMatchInput, args);
    if (!input) return;
    if (!input.connection) {
      await ctx.runMutation(internal.shopifyData.recordOutcome, {
        caseId: args.caseId,
        outcome: "not_connected",
        detail: "Shopify is not connected; customer matching is waiting.",
      });
      return;
    }
    const email = senderEmail(input.message.from);
    if (!email) {
      await ctx.runMutation(internal.shopifyData.recordOutcome, {
        caseId: args.caseId,
        outcome: "no_match",
        detail: "The sender address could not be matched safely.",
      });
      return;
    }

    try {
      const credentials = await decryptCredentials<ShopifyCredentials>(
        input.connection.encryptedCredentials,
        required("INTEGRATION_ENCRYPTION_KEY"),
      );
      const response = await fetch(
        `https://${input.connection.accountLabel}/admin/api/${required("SHOPIFY_API_VERSION")}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": credentials.accessToken,
          },
          body: JSON.stringify({
            query: CUSTOMER_QUERY,
            variables: { identifier: { emailAddress: email } },
          }),
        },
      );
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(`Shopify returned ${response.status}`);
      const customer = parseShopifyCustomer(body);
      if (!customer || customer.email !== email) {
        await ctx.runMutation(internal.shopifyData.recordOutcome, {
          caseId: args.caseId,
          outcome: "no_match",
          detail: `No exact Shopify customer matched ${email}.`,
        });
        return;
      }
      await ctx.runMutation(internal.shopifyData.saveMatch, {
        caseId: args.caseId,
        ...customer,
      });
    } catch (error) {
      await ctx.runMutation(internal.shopifyData.recordOutcome, {
        caseId: args.caseId,
        outcome: "shopify_error",
        detail:
          error instanceof Error ? error.message : "Shopify matching failed",
      });
    }
  },
});
