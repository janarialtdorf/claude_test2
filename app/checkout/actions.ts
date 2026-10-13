"use server";

// Server Action: runs ONLY on the server when the checkout form is submitted.
// The browser can call it, but can't see or change what happens inside.
//
// Steps: validate input → call the database function (which re-checks items,
// prices and stock in one transaction) → refresh the catalogue cache →
// return either errors or a confirmation summary.

import { updateTag } from "next/cache";
import { z } from "zod";
import { CUSTOMER_FIELDS, type CustomerField, parseCheckoutInput } from "@/lib/checkout";
import { copy } from "@/lib/copy";
import { CATALOGUE_CACHE_TAG } from "@/lib/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const errors = copy.checkout.errors;

export interface OrderConfirmation {
  reference: string;
  items: {
    productName: string;
    size: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
}

export type CheckoutState =
  | { status: "idle" }
  | {
      status: "error";
      formError: string;
      fieldErrors: Partial<Record<CustomerField, string>>;
      // Variant IDs the database said are short on stock.
      unavailableVariantIds: string[];
      // What the shopper typed, so the form can show it again.
      values: Partial<Record<CustomerField, string>>;
    }
  | { status: "success"; order: OrderConfirmation };

// What the database function returns. We check its shape instead of
// blindly trusting it.
const orderResultSchema = z.object({
  order_id: z.uuid(),
  subtotal_cents: z.number().int(),
  shipping_cents: z.number().int(),
  total_cents: z.number().int(),
  currency: z.string(),
  items: z.array(
    z.object({
      product_name: z.string(),
      size: z.string(),
      quantity: z.number().int(),
      unit_price_cents: z.number().int(),
      line_total_cents: z.number().int(),
    }),
  ),
});

export async function placeDemoOrder(
  _previousState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  // Read only the fields we expect, as plain strings.
  const values: Partial<Record<CustomerField, string>> = {};
  for (const field of CUSTOMER_FIELDS) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }
  const itemsValue = formData.get("items");
  const itemsJson = typeof itemsValue === "string" ? itemsValue : "";

  const errorState = (
    formError: string,
    extra: Partial<Extract<CheckoutState, { status: "error" }>> = {},
  ): CheckoutState => ({
    status: "error",
    formError,
    fieldErrors: {},
    unavailableVariantIds: [],
    values,
    ...extra,
  });

  // 1. Validate.
  const parsed = parseCheckoutInput(values, itemsJson);
  if (!parsed.success) {
    if (parsed.itemsInvalid) return errorState(errors.cartInvalid, { fieldErrors: parsed.fieldErrors });
    return errorState(errors.fixFields, { fieldErrors: parsed.fieldErrors });
  }

  // 2. Create the order in the database (one transaction).
  const { customer, items } = parsed;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("place_demo_order", {
    p_customer_name: customer.customerName,
    p_email: customer.email,
    p_address_line1: customer.addressLine1,
    p_address_line2: customer.addressLine2,
    p_city: customer.city,
    p_postal_code: customer.postalCode,
    p_country: customer.country,
    p_items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
  });

  if (error) {
    // Log only the error code/message — never the customer's details.
    console.error("place_demo_order failed:", error.code, error.message);

    if (error.message === "insufficient_stock" || error.message === "unknown_item") {
      // Stock changed since the page loaded: refresh the catalogue so the
      // cart can show which items are no longer available.
      updateTag(CATALOGUE_CACHE_TAG);
      const ids = error.message === "insufficient_stock" ? (error.details ?? "").split(",") : [];
      return errorState(errors.unavailable, { unavailableVariantIds: ids.filter(Boolean) });
    }
    if (error.message === "invalid_items") return errorState(errors.cartInvalid);
    return errorState(errors.generic);
  }

  const result = orderResultSchema.safeParse(data);
  if (!result.success) {
    console.error("place_demo_order returned an unexpected shape");
    return errorState(errors.generic);
  }

  // 3. Stock changed — make the next page load fetch fresh catalogue data.
  updateTag(CATALOGUE_CACHE_TAG);

  const order = result.data;
  return {
    status: "success",
    order: {
      // A short, readable reference (the full ID stays in the database).
      reference: order.order_id.slice(0, 8).toUpperCase(),
      items: order.items.map((item) => ({
        productName: item.product_name,
        size: item.size,
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        lineTotalCents: item.line_total_cents,
      })),
      subtotalCents: order.subtotal_cents,
      shippingCents: order.shipping_cents,
      totalCents: order.total_cents,
      currency: order.currency,
    },
  };
}
