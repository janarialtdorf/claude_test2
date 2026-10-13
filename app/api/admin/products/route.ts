// POST /api/admin/products — create a product with its sizes (admins only).
//
// Responses: 201 {id, slug} · 400 invalid input · 401 not logged in ·
// 403 not an admin / cross-site · 500 unexpected error.

import { guardAdminRequest, jsonError, readJson } from "@/lib/admin-api";
import { productFieldErrors, productInputSchema, toDatabaseProduct } from "@/lib/admin-product-schema";
import { expireCatalogueCache } from "@/lib/products";
import { slugify } from "@/lib/slug";

export async function POST(request: Request) {
  const guard = await guardAdminRequest(request);
  if (!guard.ok) return guard.response;

  const parsed = productInputSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, "Invalid product data.", { fieldErrors: productFieldErrors(parsed.error) });
  }

  const { data, error } = await guard.supabase.rpc("admin_create_product", {
    p_product: toDatabaseProduct(parsed.data),
    p_base_slug: slugify(parsed.data.name),
  });

  if (error) {
    if (error.message === "forbidden") return jsonError(403, "Admin access required.");
    // 23503 = the category doesn't exist (foreign key).
    if (error.code === "23503" || error.message === "invalid_input") {
      return jsonError(400, "Invalid product data.");
    }
    console.error("admin_create_product failed:", error.code, error.message);
    return jsonError(500, "Could not create the product.");
  }

  // Make the storefront show the change right away.
  expireCatalogueCache();
  return Response.json(data, { status: 201 });
}
