// Product image helpers (pure — used by the server and tested in lib/images.test.ts).

import { z } from "zod";
import { copy } from "@/lib/copy";

export const IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (the bucket enforces this too)
export const MAX_IMAGES_PER_PRODUCT = 8; // the database enforces this too

export type ImageType = { mime: "image/jpeg" | "image/png" | "image/webp"; extension: "jpg" | "png" | "webp" };

// Works out the real file type from the first bytes of the file ("magic
// numbers"), instead of trusting the file name or what the browser claims.
// A text file renamed to photo.jpg is rejected.
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const startsWith = (signature: number[], offset = 0) =>
    bytes.length >= offset + signature.length && signature.every((b, i) => bytes[offset + i] === b);

  if (startsWith([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", extension: "jpg" };
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", extension: "png" };
  // WebP: "RIFF" + 4 bytes of size + "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

// Public URL of an image file. The bucket is public, so anyone can view it.
export function productImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${IMAGE_BUCKET}/${encodedPath}`;
}

export const altTextSchema = z
  .string()
  .trim()
  .min(1, copy.admin.images.errors.altRequired)
  .max(300, copy.admin.images.errors.altTooLong);

export const imageUpdateSchema = z
  .object({
    altText: altTextSchema.optional(),
    makeMain: z.literal(true).optional(),
  })
  .refine((data) => data.altText !== undefined || data.makeMain !== undefined, "Nothing to update");
