// Shared product types used by the pages and components.
// lib/products.ts converts database rows (snake_case, see types/database.ts)
// into these simpler shapes, so the UI doesn't depend on table details.

export type Size = "XS" | "S" | "M" | "L" | "XL";

// The storefront only knows whether a size is in stock, never the exact
// number: the database keeps stock_quantity hidden from the public.
export type Availability = "in_stock" | "sold_out";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface ProductVariant {
  id: string;
  size: Size;
  availability: Availability;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  // Price in the smallest currency unit (cents), e.g. 3999 = 39.99.
  // Integers avoid floating-point rounding errors in totals.
  priceCents: number;
  // ISO 4217 currency code, stored explicitly for every product.
  currency: string;
  categorySlug: string;
  categoryName: string;
  colorName: string;
  // Background colour for the placeholder image (we have no real photos yet).
  placeholderColor: string;
  featured: boolean;
  variants: ProductVariant[];
}
