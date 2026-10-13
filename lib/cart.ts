// Cart logic as pure functions: they take data in and return new data out,
// without touching React, the browser or localStorage. That makes them easy
// to test (see lib/cart.test.ts) and easy to reuse on the server later.
//
// None of these functions change the array they receive; they always return
// a new array. React relies on this to notice that the cart changed.

import type { CartCatalogue, CartItem, CartLine } from "@/types/cart";

export const MAX_QUANTITY_PER_ITEM = 10;

export type AddResult = "added" | "limit_reached";

// Adds one variant to the cart, or increases its quantity if it's already there.
// The quantity never goes above MAX_QUANTITY_PER_ITEM.
export function addItem(
  items: CartItem[],
  variantId: string,
  quantity = 1,
): { items: CartItem[]; result: AddResult } {
  const existing = items.find((item) => item.variantId === variantId);

  if (!existing) {
    const newItem = { variantId, quantity: clampQuantity(quantity) };
    return { items: [...items, newItem], result: "added" };
  }

  if (existing.quantity >= MAX_QUANTITY_PER_ITEM) {
    return { items, result: "limit_reached" };
  }

  return {
    items: items.map((item) =>
      item.variantId === variantId
        ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
        : item,
    ),
    result: "added",
  };
}

// Sets an exact quantity (e.g. from the quantity dropdown).
// Invalid values are clamped into the allowed range 1–MAX.
export function updateQuantity(
  items: CartItem[],
  variantId: string,
  quantity: number,
): CartItem[] {
  return items.map((item) =>
    item.variantId === variantId ? { ...item, quantity: clampQuantity(quantity) } : item,
  );
}

export function removeItem(items: CartItem[], variantId: string): CartItem[] {
  return items.filter((item) => item.variantId !== variantId);
}

// Turns any number into a whole number between 1 and MAX_QUANTITY_PER_ITEM.
export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, Math.floor(quantity)));
}

// Reads the cart saved in localStorage. That text could be anything
// (old format, hand-edited, corrupted), so we treat it as untrusted:
// invalid entries are dropped, quantities are clamped, duplicates merged.
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  let items: CartItem[] = [];
  for (const entry of data) {
    if (
      typeof entry === "object" &&
      entry !== null &&
      typeof entry.variantId === "string" &&
      entry.variantId.length > 0 &&
      entry.variantId.length <= 100 &&
      typeof entry.quantity === "number"
    ) {
      items = addItem(items, entry.variantId, entry.quantity).items;
    }
  }
  return items;
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify(items);
}

// Joins cart items with catalogue info. Items whose variant no longer exists
// or is sold out are left out, and counted in `unavailableCount`.
export function buildCartLines(
  items: CartItem[],
  catalogue: CartCatalogue,
): { lines: CartLine[]; unavailableCount: number } {
  const lines: CartLine[] = [];
  let unavailableCount = 0;

  for (const item of items) {
    // Object.hasOwn avoids matching built-in keys like "toString".
    const variant = Object.hasOwn(catalogue, item.variantId)
      ? catalogue[item.variantId]
      : undefined;
    if (!variant || !variant.available) {
      unavailableCount++;
      continue;
    }
    lines.push({
      variantId: item.variantId,
      quantity: item.quantity,
      variant,
      lineTotalCents: variant.priceCents * item.quantity,
    });
  }
  return { lines, unavailableCount };
}

// Adds up line totals in integer cents. All lines must share one currency;
// mixing currencies would give a meaningless number, so we refuse.
export function calculateSubtotal(lines: CartLine[]): {
  amountCents: number;
  currency: string | null;
} {
  if (lines.length === 0) return { amountCents: 0, currency: null };

  const currency = lines[0].variant.currency;
  let amountCents = 0;
  for (const line of lines) {
    if (line.variant.currency !== currency) {
      throw new Error("Cart contains more than one currency");
    }
    amountCents += line.lineTotalCents;
  }
  return { amountCents, currency };
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}
