// PATCH  /api/admin/products/[id] — edit a product and its sizes.
// DELETE /api/admin/products/[id] — delete a product permanently.
// Admins only. Past orders keep their own copy of name/size/price.
//
// Responses: 200 {id, slug} / 204 · 400 · 401 · 403 · 404 · 500.

import { revalidateTag } from "next/cache";
import { UUID_PATTERN, guardAdminRequest, jsonError, readJson } from "@/lib/admin-api";
import { productFieldErrors, productInputSchema, toDatabaseProduct } from "@/lib/admin-product-schema";
import { IMAGE_BUCKET } from "@/lib/images";
import { CATALOGUE_CACHE_TAG } from "@/lib/products";

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  const guard = await guardAdminRequest(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!UUID_PATTERN.test(id)) return jsonError(404, "Product not found.");

  const parsed = productInputSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, "Invalid product data.", { fieldErrors: productFieldErrors(parsed.error) });
  }

  const { data, error } = await guard.supabase.rpc("admin_update_product", {
    p_id: id,
    p_product: toDatabaseProduct(parsed.data),
  });

  if (error) {
    if (error.message === "forbidden") return jsonError(403, "Admin access required.");
    if (error.message === "not_found") return jsonError(404, "Product not found.");
    if (error.code === "23503" || error.message === "invalid_input") {
      return jsonError(400, "Invalid product data.");
    }
    console.error("admin_update_product failed:", error.code, error.message);
    return jsonError(500, "Could not save the product.");
  }

  revalidateTag(CATALOGUE_CACHE_TAG, { expire: 0 });
  return Response.json(data, { status: 200 });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  const guard = await guardAdminRequest(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!UUID_PATTERN.test(id)) return jsonError(404, "Product not found.");

  // Remember the image files first: the rows disappear with the product.
  const { data: images, error: imagesError } = await guard.supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);
  if (imagesError) {
    console.error("Product delete: listing images failed:", imagesError.code, imagesError.message);
    return jsonError(500, "Could not delete the product.");
  }

  // RLS only lets admins delete. Sizes and image rows are deleted with the
  // product (on delete cascade); order lines keep their snapshots.
  const { data, error } = await guard.supabase.from("products").delete().eq("id", id).select("id");

  if (error) {
    console.error("Product delete failed:", error.code, error.message);
    return jsonError(500, "Could not delete the product.");
  }
  if (data.length === 0) return jsonError(404, "Product not found.");

  if (images.length > 0) {
    const { error: storageError } = await guard.supabase.storage
      .from(IMAGE_BUCKET)
      .remove(images.map((image) => image.storage_path));
    if (storageError) console.error("Removing product image files failed (orphan files):", storageError.message);
  }

  revalidateTag(CATALOGUE_CACHE_TAG, { expire: 0 });
  return new Response(null, { status: 204 });
}
