import { z } from "zod";

const tracking = z.object({
  number: z.string().nullish(),
  url: z.string().nullish(),
});

const fulfillment = z.object({
  displayStatus: z.string().nullish(),
  trackingInfo: z.array(tracking),
});

const order = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  displayFulfillmentStatus: z.string(),
  lineItems: z.object({ nodes: z.array(z.object({ name: z.string() })) }),
  fulfillments: z.array(fulfillment),
});

const result = z.object({
  data: z
    .object({
      customerByIdentifier: z
        .object({
          id: z.string(),
          displayName: z.string(),
          defaultEmailAddress: z.object({ emailAddress: z.string() }),
          orders: z.object({ nodes: z.array(order) }),
        })
        .nullable(),
    })
    .optional(),
  errors: z.array(z.object({ message: z.string() })).optional(),
});

export type ShopifyCustomerSnapshot = {
  shopifyCustomerId: string;
  name: string;
  email: string;
  orders: Array<{
    shopifyOrderId: string;
    name: string;
    createdAt: string;
    lineItems: string[];
    fulfillmentStatus: string;
    trackingNumber?: string;
    trackingUrl?: string;
  }>;
};

export function parseShopifyCustomer(
  value: unknown,
): ShopifyCustomerSnapshot | null {
  const parsed = result.parse(value);
  if (parsed.errors?.length) {
    throw new Error(parsed.errors.map((error) => error.message).join("; "));
  }
  const customer = parsed.data?.customerByIdentifier;
  if (!customer) return null;

  return {
    shopifyCustomerId: customer.id,
    name: customer.displayName,
    email: customer.defaultEmailAddress.emailAddress.toLowerCase(),
    orders: customer.orders.nodes.map((item) => {
      const trackedFulfillment = item.fulfillments.find((entry) =>
        entry.trackingInfo.some((detail) => detail.number || detail.url),
      );
      const activeFulfillment = trackedFulfillment ?? item.fulfillments.at(-1);
      const trackingDetail = activeFulfillment?.trackingInfo.find(
        (detail) => detail.number || detail.url,
      );
      return {
        shopifyOrderId: item.id,
        name: item.name,
        createdAt: item.createdAt,
        lineItems: item.lineItems.nodes.map((lineItem) => lineItem.name),
        fulfillmentStatus:
          activeFulfillment?.displayStatus ?? item.displayFulfillmentStatus,
        ...(trackingDetail?.number
          ? { trackingNumber: trackingDetail.number }
          : {}),
        ...(trackingDetail?.url ? { trackingUrl: trackingDetail.url } : {}),
      };
    }),
  };
}
