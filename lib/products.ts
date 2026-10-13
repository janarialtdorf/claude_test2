// DEMO DATA — these products are samples for a learning project, not real items.
//
// This file is the single source of truth for the catalogue (names, prices,
// sizes). Pages read data only through the functions at the bottom, so we can
// later swap this array for a database without rewriting every page.

import type { CartCatalogue } from "@/types/cart";
import type { Category, Product, Size } from "@/types/product";

const categories: Category[] = [
  {
    id: "cat-tops",
    slug: "tops",
    name: "Tops",
    description: "T-shirts, long-sleeves and shirts.",
  },
  {
    id: "cat-bottoms",
    slug: "bottoms",
    name: "Bottoms",
    description: "Trousers, jeans and skirts.",
  },
  {
    id: "cat-outerwear",
    slug: "outerwear",
    name: "Outerwear",
    description: "Jackets and coats.",
  },
];

const ALL_SIZES: Size[] = ["XS", "S", "M", "L", "XL"];

// Helper to build size variants. Any size listed in `soldOut` is marked unavailable.
function sizes(productId: string, soldOut: Size[] = []) {
  return ALL_SIZES.map((size) => ({
    id: `${productId}-${size.toLowerCase()}`,
    size,
    availability: soldOut.includes(size) ? ("sold_out" as const) : ("in_stock" as const),
  }));
}

const products: Product[] = [
  {
    id: "p-001",
    slug: "classic-cotton-t-shirt",
    name: "Classic Cotton T-Shirt",
    description: "A plain crew-neck T-shirt with a regular fit.",
    priceCents: 1999,
    currency: "EUR",
    categorySlug: "tops",
    colorName: "Off-white",
    placeholderColor: "#e9e4d8",
    featured: true,
    variants: sizes("p-001", ["XL"]),
  },
  {
    id: "p-002",
    slug: "striped-long-sleeve-tee",
    name: "Striped Long-Sleeve Tee",
    description: "A long-sleeve top with horizontal stripes.",
    priceCents: 2799,
    currency: "EUR",
    categorySlug: "tops",
    colorName: "Navy / white",
    placeholderColor: "#33415e",
    featured: false,
    variants: sizes("p-002"),
  },
  {
    id: "p-003",
    slug: "linen-button-up-shirt",
    name: "Linen Button-Up Shirt",
    description: "A relaxed button-up shirt with a classic collar.",
    priceCents: 4499,
    currency: "EUR",
    categorySlug: "tops",
    colorName: "Sage",
    placeholderColor: "#a3b18a",
    featured: true,
    variants: sizes("p-003", ["S"]),
  },
  {
    id: "p-004",
    slug: "relaxed-chino-trousers",
    name: "Relaxed Chino Trousers",
    description: "Chino trousers with a relaxed, straight leg.",
    priceCents: 4999,
    currency: "EUR",
    categorySlug: "bottoms",
    colorName: "Khaki",
    placeholderColor: "#c4b48a",
    featured: false,
    variants: sizes("p-004"),
  },
  {
    id: "p-005",
    slug: "straight-leg-jeans",
    name: "Straight-Leg Jeans",
    description: "Five-pocket jeans with a straight leg.",
    priceCents: 5999,
    currency: "EUR",
    categorySlug: "bottoms",
    colorName: "Indigo",
    placeholderColor: "#3d4b6e",
    featured: true,
    variants: sizes("p-005", ["M"]),
  },
  {
    id: "p-006",
    slug: "pleated-midi-skirt",
    name: "Pleated Midi Skirt",
    description: "A pleated skirt that falls below the knee.",
    priceCents: 3999,
    currency: "EUR",
    categorySlug: "bottoms",
    colorName: "Terracotta",
    placeholderColor: "#b5654a",
    featured: false,
    // Every size sold out, so we can test the "sold out" display.
    variants: sizes("p-006", ["XS", "S", "M", "L", "XL"]),
  },
  {
    id: "p-007",
    slug: "quilted-lightweight-jacket",
    name: "Quilted Lightweight Jacket",
    description: "A light quilted jacket with a snap-button front.",
    priceCents: 7999,
    currency: "EUR",
    categorySlug: "outerwear",
    colorName: "Olive",
    placeholderColor: "#5b6142",
    featured: true,
    variants: sizes("p-007"),
  },
  {
    id: "p-008",
    slug: "wool-blend-overcoat",
    name: "Wool-Blend Overcoat",
    description: "A knee-length overcoat with a notched collar.",
    priceCents: 14999,
    currency: "EUR",
    categorySlug: "outerwear",
    colorName: "Charcoal",
    placeholderColor: "#3a3a3c",
    featured: false,
    variants: sizes("p-008", ["XS"]),
  },
];

// ---- Data access functions (the only way pages should read catalogue data) ----

export function getCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

export function getAllProducts(): Product[] {
  return products;
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((product) => product.categorySlug === categorySlug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

// A product counts as available if at least one size is in stock.
export function isProductAvailable(product: Product): boolean {
  return product.variants.some((variant) => variant.availability === "in_stock");
}

// The small summary of every variant that the browser cart needs.
// The server passes this to client components, so they never import this
// file directly — which lets us move the catalogue into a database later.
export function getCartCatalogue(): CartCatalogue {
  const catalogue: CartCatalogue = {};
  for (const product of products) {
    for (const variant of product.variants) {
      catalogue[variant.id] = {
        variantId: variant.id,
        productSlug: product.slug,
        productName: product.name,
        size: variant.size,
        priceCents: product.priceCents,
        currency: product.currency,
        available: variant.availability === "in_stock",
        placeholderColor: product.placeholderColor,
      };
    }
  }
  return catalogue;
}
