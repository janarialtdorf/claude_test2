// Turns an admin API error response into a message for the admin forms.
// Used by the product form, the delete button and the image gallery, so they
// all explain 401/403/404 the same way.

import { copy } from "@/lib/copy";

const errors = copy.admin.form.errors;

export function adminErrorMessage(status: number, body?: { error?: unknown }): string {
  if (status === 401) return errors.sessionExpired;
  if (status === 403) return errors.forbidden;
  if (status === 404) return errors.notFound;
  // For 400/409/413 the server sends a specific, user-friendly message.
  if (status >= 400 && status < 500 && typeof body?.error === "string") return body.error;
  return errors.generic;
}
