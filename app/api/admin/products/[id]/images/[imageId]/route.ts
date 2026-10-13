// PATCH  /api/admin/products/[id]/images/[imageId] — change alt text and/or
//        make this the main image. Body: {"altText"?: string, "makeMain"?: true}
// DELETE /api/admin/products/[id]/images/[imageId] — delete the image + file.
// Admins only. Responses: 200 / 204 · 400 · 401 · 403 · 404 · 500.

import { guardAdminRequest, jsonError, readJson } from "@/lib/admin-api";
import { IMAGE_BUCKET, imageUpdateSchema } from "@/lib/images";
import { expireCatalogueCache } from "@/lib/products";
import { isUuid } from "@/lib/validation";

type Context = RouteContext<"/api/admin/products/[id]/images/[imageId]">;

export async function PATCH(request: Request, ctx: Context) {
  const guard = await guardAdminRequest(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const { id: productId, imageId } = await ctx.params;
  if (!isUuid(productId) || !isUuid(imageId)) return jsonError(404, "Image not found.");

  const parsed = imageUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid data.";
    return jsonError(400, message, { fieldErrors: { altText: message } });
  }

  const changes: { alt_text?: string; sort_order?: number } = {};
  if (parsed.data.altText !== undefined) changes.alt_text = parsed.data.altText;

  if (parsed.data.makeMain) {
    // Put this image before the current first one.
    const { data: first, error } = await supabase
      .from("product_images")
      .select("sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Make main: lookup failed:", error.code, error.message);
      return jsonError(500, "Could not update the image.");
    }
    if (first) changes.sort_order = first.sort_order - 1;
  }

  const { data, error } = await supabase
    .from("product_images")
    .update(changes)
    .eq("id", imageId)
    .eq("product_id", productId)
    .select("id");
  if (error) {
    console.error("Image update failed:", error.code, error.message);
    return jsonError(500, "Could not update the image.");
  }
  if (data.length === 0) return jsonError(404, "Image not found.");

  expireCatalogueCache();
  return Response.json({ id: imageId }, { status: 200 });
}

export async function DELETE(request: Request, ctx: Context) {
  const guard = await guardAdminRequest(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const { id: productId, imageId } = await ctx.params;
  if (!isUuid(productId) || !isUuid(imageId)) return jsonError(404, "Image not found.");

  const { data, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId)
    .select("storage_path");
  if (error) {
    console.error("Image delete failed:", error.code, error.message);
    return jsonError(500, "Could not delete the image.");
  }
  if (data.length === 0) return jsonError(404, "Image not found.");

  // The row is gone (so the shop stops showing it); now remove the file.
  const { error: storageError } = await supabase.storage.from(IMAGE_BUCKET).remove([data[0].storage_path]);
  if (storageError) console.error("Removing image file failed (orphan file):", storageError.message);

  expireCatalogueCache();
  return new Response(null, { status: 204 });
}
