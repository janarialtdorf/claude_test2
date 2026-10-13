// Catalogue data access. This is the ONLY place that reads products from the
// database; pages and components call the functions below.
//
// The whole (small) catalogue is loaded with one cached query. "use cache"
// stores the result on the server, and cacheLife("minutes") refreshes it at
// most about once a minute — so visitors don't each trigger a database query,
// but stock changes still show up quickly.
//
// Note: loading everything at once is fine for a few dozen products. A large
// shop would query only what each page needs.

import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { productImageUrl, sortImages } from "@/lib/images";
import { sortBySize } from "@/lib/sizes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CartCatalogue } from "@/types/cart";
import type { Category, Product } from "@/types/product";

interface Catalogue {
  categories: Category[];
  products: Product[];
}

// Name for this cached data, so a Server Action can refresh it on demand
// (e.g. right after an order changes the stock).
export const CATALOGUE_CACHE_TAG = "catalogue";

// For admin endpoints (Route Handlers): expire the cached catalogue
// immediately, so the shop shows a product change right away.
// (The checkout Server Action uses updateTag(CATALOGUE_CACHE_TAG) instead,
// which only works inside Server Actions.)
export function expireCatalogueCache() {
  revalidateTag(CATALOGUE_CACHE_TAG, { expire: 0 });
}

async function getCatalogue(): Promise<Catalogue> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOGUE_CACHE_TAG);

  const supabase = createSupabaseServerClient();

  // Two queries run in parallel. Row Level Security on the database already
  // hides unpublished products; the .eq() filter makes that explicit here too.
  const [categoriesResult, productsResult] = await Promise.all([
    supabase.from("categories").select("id, slug, name, description").order("sort_order"),
    supabase
      .from("products")
      .select(
        `id, slug, name, description, price_cents, currency, color_name,
         placeholder_color, featured,
         category:categories!inner ( slug, name ),
         variants:product_variants ( id, size, in_stock ),
         images:product_images ( storage_path, alt_text, sort_order, created_at )`,
      )
      .eq("is_published", true)
      .order("sort_order"),
  ]);

  if (categoriesResult.error || productsResult.error) {
    // Details go to the server log only; the visitor sees the friendly error page.
    console.error("Failed to load catalogue", categoriesResult.error ?? productsResult.error);
    throw new Error("Failed to load the product catalogue.");
  }

  const categories: Category[] = categoriesResult.data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
  }));

  const products: Product[] = productsResult.data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    categorySlug: row.category.slug,
    categoryName: row.category.name,
    colorName: row.color_name,
    placeholderColor: row.placeholder_color,
    featured: row.featured,
    variants: sortBySize(row.variants).map((variant) => ({
        id: variant.id,
        size: variant.size,
        // Only an explicit `true` counts as in stock (the type allows null).
        availability: variant.in_stock === true ? "in_stock" : "sold_out",
      })),
    images: sortImages(row.images).map((image) => ({
      url: productImageUrl(image.storage_path),
      alt: image.alt_text,
    })),
  }));

  return { categories, products };
}

// ---- Data access functions (the only way pages should read catalogue data) ----

export async function getCategories(): Promise<Category[]> {
  return (await getCatalogue()).categories;
}

export async function getAllProducts(): Promise<Product[]> {
  return (await getCatalogue()).products;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  return (await getAllProducts()).filter((product) => product.categorySlug === categorySlug);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return (await getAllProducts()).filter((product) => product.featured);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getAllProducts()).find((product) => product.slug === slug);
}

// A product counts as available if at least one size is in stock.
export function isProductAvailable(product: Product): boolean {
  return product.variants.some((variant) => variant.availability === "in_stock");
}

// The small summary of every variant that the browser cart needs.
// The server passes this to client components, so they never import this
// file (or the database client) directly.
export async function getCartCatalogue(): Promise<CartCatalogue> {
  const catalogue: CartCatalogue = {};
  for (const product of await getAllProducts()) {
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
        imageUrl: product.images[0]?.url ?? null,
      };
    }
  }
  return catalogue;
}
