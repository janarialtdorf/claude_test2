import type { Size } from "@/types/product";

// What we save in the browser: only which variant and how many.
// Prices are NOT stored here — they are always looked up in the catalogue,
// so editing localStorage can never change a price.
export interface CartItem {
  variantId: string;
  quantity: number;
}

// The product information the cart needs to display one variant.
// The server builds this from the catalogue and passes it to the browser.
export interface CartVariantInfo {
  variantId: string;
  productSlug: string;
  productName: string;
  size: Size;
  priceCents: number;
  currency: string;
  available: boolean;
  placeholderColor: string;
}

// variantId → info, for quick lookups.
export type CartCatalogue = Record<string, CartVariantInfo>;

// A cart item joined with its product info, ready to show on screen.
export interface CartLine {
  variantId: string;
  quantity: number;
  variant: CartVariantInfo;
  lineTotalCents: number;
}
