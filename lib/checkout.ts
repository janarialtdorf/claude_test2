// Validation rules for the checkout form, written with Zod.
//
// These run on the SERVER (in the Server Action). Anything the browser sends
// is untrusted, so we check type, length and format here — and the database
// function checks the items again before saving anything.
//
// parseCheckoutInput is a pure function (no FormData, no database), so it can
// be unit tested in lib/checkout.test.ts.

import { z } from "zod";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart";
import { copy } from "@/lib/copy";

const messages = copy.checkout.errors;

export const MAX_ORDER_LINES = 20;

// Where demo orders can be "delivered". Codes are ISO 3166-1 alpha-2.
export const DELIVERY_COUNTRIES = [{ code: "EE", name: "Estonia" }] as const;
const countryCodes = DELIVERY_COUNTRIES.map((country) => country.code) as ["EE"];

function requiredText(max: number) {
  return z.string().trim().min(1, messages.required).max(max, messages.tooLong);
}

export const customerDetailsSchema = z.object({
  customerName: requiredText(200),
  email: requiredText(320).pipe(z.email(messages.email)),
  addressLine1: requiredText(200),
  addressLine2: z.string().trim().max(200, messages.tooLong),
  city: requiredText(100),
  // Estonian postal codes are exactly 5 digits.
  postalCode: z.string().trim().regex(/^\d{5}$/, messages.postalCode),
  country: z.enum(countryCodes, messages.country),
});

export type CustomerDetails = z.infer<typeof customerDetailsSchema>;
export type CustomerField = keyof CustomerDetails;
export const CUSTOMER_FIELDS = Object.keys(customerDetailsSchema.shape) as CustomerField[];

export const orderItemsSchema = z
  .array(
    z.object({
      variantId: z.uuid(),
      quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
    }),
  )
  .min(1)
  .max(MAX_ORDER_LINES)
  .refine(
    (items) => new Set(items.map((item) => item.variantId)).size === items.length,
    "Each size may appear only once",
  );

export type OrderItemInput = z.infer<typeof orderItemsSchema>[number];

export type CheckoutParseResult =
  | { success: true; customer: CustomerDetails; items: OrderItemInput[] }
  | {
      success: false;
      fieldErrors: Partial<Record<CustomerField, string>>;
      itemsInvalid: boolean;
    };

// `fields` are the raw form values; `itemsJson` is the cart as JSON text.
export function parseCheckoutInput(
  fields: Partial<Record<CustomerField, string>>,
  itemsJson: string,
): CheckoutParseResult {
  const customerResult = customerDetailsSchema.safeParse({
    ...fields,
    addressLine2: fields.addressLine2 ?? "",
  });

  let itemsData: unknown;
  try {
    itemsData = JSON.parse(itemsJson);
  } catch {
    itemsData = null;
  }
  const itemsResult = orderItemsSchema.safeParse(itemsData);

  if (customerResult.success && itemsResult.success) {
    return { success: true, customer: customerResult.data, items: itemsResult.data };
  }

  // Keep only the first error message per field, for display next to it.
  const fieldErrors: Partial<Record<CustomerField, string>> = {};
  if (!customerResult.success) {
    const flattened = z.flattenError(customerResult.error).fieldErrors;
    for (const field of CUSTOMER_FIELDS) {
      const first = flattened[field]?.[0];
      if (first) fieldErrors[field] = first;
    }
  }
  return { success: false, fieldErrors, itemsInvalid: !itemsResult.success };
}
