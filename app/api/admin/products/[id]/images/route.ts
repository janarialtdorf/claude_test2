// POST /api/admin/products/[id]/images — upload one image (admins only).
// Body: multipart form data with "file" (JPEG/PNG/WebP, ≤ 5 MB) and "altText".
//
// Responses: 201 {id, url, altText} · 400 invalid · 401 · 403 · 404 product
// not found · 409 already 8 images · 413 file too large · 500.

import { randomUUID } from "node:crypto";
import { guardAdminRequest, jsonError } from "@/lib/admin-api";
import { copy } from "@/lib/copy";
import {
  IMAGE_BUCKET,
  MAX_IMAGES_PER_PRODUCT,
  MAX_IMAGE_BYTES,
  altTextSchema,
  detectImageType,
  productImageUrl,
} from "@/lib/images";
import { expireCatalogueCache } from "@/lib/products";
import { isUuid } from "@/lib/validation";

const errors = copy.admin.images.errors;

export async function POST(request: Request, ctx: RouteContext<"/api/admin/products/[id]/images">) {
  const guard = await guardAdminRequest(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const { id: productId } = await ctx.params;
  if (!isUuid(productId)) return jsonError(404, "Product not found.");

  // Refuse obviously oversized requests before reading them.
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_IMAGE_BYTES + 64 * 1024) return jsonError(413, errors.tooLarge);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, errors.noFile);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return jsonError(400, errors.noFile, { fieldErrors: { file: errors.noFile } });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return jsonError(413, errors.tooLarge, { fieldErrors: { file: errors.tooLarge } });
  }

  const alt = altTextSchema.safeParse(form.get("altText") ?? "");
  if (!alt.success) {
    const message = alt.error.issues[0]?.message ?? errors.altRequired;
    return jsonError(400, message, { fieldErrors: { altText: message } });
  }

  // Check the real file type from its content, not its name.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return jsonError(400, errors.wrongType, { fieldErrors: { file: errors.wrongType } });

  // The product must exist (admins can see hidden products too).
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (productError) {
    console.error("Image upload: product lookup failed:", productError.code, productError.message);
    return jsonError(500, "Could not upload the image.");
  }
  if (!product) return jsonError(404, "Product not found.");

  // Friendly early check; the database trigger enforces the limit anyway.
  const { data: existing, error: listError } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false });
  if (listError) {
    console.error("Image upload: listing images failed:", listError.code, listError.message);
    return jsonError(500, "Could not upload the image.");
  }
  if (existing.length >= MAX_IMAGES_PER_PRODUCT) return jsonError(409, copy.admin.images.limitReached);

  // A random file name: can't be guessed or clash, and never reused, so
  // browsers and the image optimizer can cache it forever.
  const storagePath = `${productId}/${randomUUID()}.${type.extension}`;
  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(storagePath, bytes, {
    contentType: type.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) {
    console.error("Image upload to storage failed:", uploadError.message);
    return jsonError(500, "Could not upload the image.");
  }

  // New images go to the end of the gallery.
  const nextSortOrder = existing.length > 0 ? existing[0].sort_order + 1 : 0;
  const { data: image, error: insertError } = await supabase
    .from("product_images")
    .insert({ product_id: productId, storage_path: storagePath, alt_text: alt.data, sort_order: nextSortOrder })
    .select("id, storage_path, alt_text")
    .single();

  if (insertError) {
    // Don't leave an orphan file behind if the row couldn't be saved.
    await supabase.storage.from(IMAGE_BUCKET).remove([storagePath]);
    if (insertError.message.includes("image_limit_reached")) {
      return jsonError(409, copy.admin.images.limitReached);
    }
    console.error("Saving image row failed:", insertError.code, insertError.message);
    return jsonError(500, "Could not upload the image.");
  }

  expireCatalogueCache();
  return Response.json(
    { id: image.id, url: productImageUrl(image.storage_path), altText: image.alt_text },
    { status: 201 },
  );
}
