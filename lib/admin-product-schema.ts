// Validation rules for creating/editing a product (admin API).
// The server always validates with these; the database checks again.

import { z } from "zod";
import { copy } from "@/lib/copy";
import { SIZES } from "@/lib/sizes";
import { firstFieldErrors } from "@/lib/validation";

const messages = copy.admin.form.errors;

export const MAX_PRICE_CENTS = 1_000_000; // €10,000
export const MAX_STOCK = 100_000;

export const productInputSchema = z.object({
  name: z.string().trim().min(1, messages.required).max(200, messages.tooLong),
  description: z.string().trim().max(2000, messages.tooLong),
  priceCents: z.number(messages.price).int(messages.price).min(0, messages.price).max(MAX_PRICE_CENTS, messages.price),
  categoryId: z.uuid(messages.category),
  colorName: z.string().trim().max(100, messages.tooLong),
  placeholderColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, messages.color),
  featured: z.boolean(),
  isPublished: z.boolean(),
  sizes: z
    .array(
      z.object({
        size: z.enum(SIZES),
        stockQuantity: z.number(messages.stock).int(messages.stock).min(0, messages.stock).max(MAX_STOCK, messages.stock),
      }),
    )
    .min(1, messages.sizes)
    .max(SIZES.length)
    .refine((sizes) => new Set(sizes.map((s) => s.size)).size === sizes.length, messages.sizes),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductField = keyof ProductInput;

// The shape the database functions expect (snake_case).
export function toDatabaseProduct(input: ProductInput) {
  return {
    name: input.name,
    description: input.description,
    price_cents: input.priceCents,
    category_id: input.categoryId,
    color_name: input.colorName,
    placeholder_color: input.placeholderColor,
    featured: input.featured,
    is_published: input.isPublished,
    sizes: input.sizes.map((s) => ({ size: s.size, stock_quantity: s.stockQuantity })),
  };
}

// First error message per field, for showing next to form fields.
export function productFieldErrors(error: z.ZodError): Partial<Record<ProductField, string>> {
  return firstFieldErrors<ProductField>(error);
}
