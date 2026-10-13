// Shared product types. These describe the shape of our (demo) catalogue data.
// Later, when we add a database, these types should match the database schema.

export type Size = "XS" | "S" | "M" | "L" | "XL";

// We store a simple availability state instead of exact stock counts,
// because demo data should not pretend to know real inventory levels.
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
  currency: "EUR";
  categorySlug: string;
  colorName: string;
  // Background colour for the placeholder image (we have no real photos yet).
  placeholderColor: string;
  featured: boolean;
  variants: ProductVariant[];
}
