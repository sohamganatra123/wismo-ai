import { describe, expect, it } from "vitest";
import { parseShopifyCustomer } from "./shopifyCustomer";

const response = {
  data: {
    customerByIdentifier: {
      id: "gid://shopify/Customer/1",
      displayName: "Amina Malik",
      defaultEmailAddress: { emailAddress: "amina@example.com" },
      orders: {
        nodes: [
          {
            id: "gid://shopify/Order/4921",
            name: "#4921",
            createdAt: "2026-08-28T10:00:00Z",
            displayFulfillmentStatus: "FULFILLED",
            lineItems: { nodes: [{ name: "Linen overshirt" }] },
            fulfillments: [
              { displayStatus: "IN_TRANSIT", trackingInfo: [] },
              {
                displayStatus: "OUT_FOR_DELIVERY",
                trackingInfo: [
                  {
                    number: "TRK-123",
                    url: "https://track.example/TRK-123",
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
};

describe("Shopify customer response", () => {
  it("keeps customer, order, fulfillment, and first available tracking", () => {
    expect(parseShopifyCustomer(response)).toEqual({
      shopifyCustomerId: "gid://shopify/Customer/1",
      name: "Amina Malik",
      email: "amina@example.com",
      orders: [
        {
          shopifyOrderId: "gid://shopify/Order/4921",
          name: "#4921",
          createdAt: "2026-08-28T10:00:00Z",
          lineItems: ["Linen overshirt"],
          fulfillmentStatus: "OUT_FOR_DELIVERY",
          trackingNumber: "TRK-123",
          trackingUrl: "https://track.example/TRK-123",
        },
      ],
    });
  });

  it("uses the order status and omits tracking when fulfillment data is absent", () => {
    const value = structuredClone(response);
    value.data.customerByIdentifier.orders.nodes[0].fulfillments = [];
    const order = parseShopifyCustomer(value)?.orders[0];
    expect(order?.fulfillmentStatus).toBe("FULFILLED");
    expect(order).not.toHaveProperty("trackingNumber");
    expect(order).not.toHaveProperty("trackingUrl");
  });

  it("returns null when Shopify has no exact customer", () => {
    expect(
      parseShopifyCustomer({ data: { customerByIdentifier: null } }),
    ).toBeNull();
  });

  it("rejects GraphQL errors instead of treating them as no match", () => {
    expect(() =>
      parseShopifyCustomer({ errors: [{ message: "Access denied" }] }),
    ).toThrow("Access denied");
  });
});
