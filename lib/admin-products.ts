// Product data for ADMIN pages: includes hidden products and exact stock.
// Queries run as the logged-in admin (RLS lets admins see everything);
// they're not cached, so admins always see the current state.

import "server-only";
import { SIZES } from "@/lib/admin-product-schema";
import { createSupabaseSessionClient } from "@/lib/supabase/session";
import type { Size } from "@/types/product";

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  colorName: string;
  placeholderColor: string;
  featured: boolean;
  isPublished: boolean;
  sizes: { size: Size; stockQuantity: number }[];
}

const PRODUCT_COLUMNS = `id, slug, name, description, price_cents, currency, category_id,
  color_name, placeholder_color, featured, is_published,
  category:categories!inner ( name ),
  variants:product_variants ( size, stock_quantity )`;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  category_id: string;
  color_name: string;
  placeholder_color: string;
  featured: boolean;
  is_published: boolean;
  category: { name: string };
  variants: { size: string; stock_quantity: number }[];
};

function toAdminProduct(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    categoryId: row.category_id,
    categoryName: row.category.name,
    colorName: row.color_name,
    placeholderColor: row.placeholder_color,
    featured: row.featured,
    isPublished: row.is_published,
    sizes: row.variants
      .filter((v): v is { size: Size; stock_quantity: number } => SIZES.includes(v.size as Size))
      .sort((a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size))
      .map((v) => ({ size: v.size, stockQuantity: v.stock_quantity })),
  };
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const supabase = await createSupabaseSessionClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).order("sort_order");
  if (error) {
    console.error("Failed to load admin products:", error.code, error.message);
    throw new Error("Failed to load products.");
  }
  return (data as ProductRow[]).map(toAdminProduct);
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const supabase = await createSupabaseSessionClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    console.error("Failed to load admin product:", error.code, error.message);
    throw new Error("Failed to load the product.");
  }
  return data ? toAdminProduct(data as ProductRow) : null;
}

export async function getAdminCategories(): Promise<{ id: string; name: string }[]> {
  const supabase = await createSupabaseSessionClient();
  const { data, error } = await supabase.from("categories").select("id, name").order("sort_order");
  if (error) {
    console.error("Failed to load categories:", error.code, error.message);
    throw new Error("Failed to load categories.");
  }
  return data;
}
