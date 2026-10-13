// Small shared validation helpers (pure — tested in lib/validation.test.ts).

import { z } from "zod";

const uuidSchema = z.uuid();

// True if the text is a valid ID (UUID), e.g. from a URL like /products/[id].
// The same Zod rule is used for IDs in request bodies.
export function isUuid(value: string): boolean {
  return uuidSchema.safeParse(value).success;
}

// Turns a Zod error into "first message per field", for showing next to
// form fields: { email: "Enter a valid email…", city: "This field is required." }
export function firstFieldErrors<Field extends string>(error: z.ZodError): Partial<Record<Field, string>> {
  const flattened = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const result: Partial<Record<Field, string>> = {};
  for (const [field, messages] of Object.entries(flattened)) {
    if (messages?.[0]) result[field as Field] = messages[0];
  }
  return result;
}
