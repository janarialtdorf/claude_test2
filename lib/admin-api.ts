// Shared guard for every admin API endpoint (app/api/admin/...).
//
// 1. Origin check: the request must come from our own site. This blocks
//    cross-site request forgery (another website making your browser send
//    requests with your login cookie).
// 2. Login + role check on the server: 401 if not logged in, 403 if not admin.
// The database checks the role again (RLS + is_admin() in the functions).

import "server-only";
import { getAdminStatus } from "@/lib/auth";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

export function jsonError(status: number, error: string, extra: Record<string, unknown> = {}) {
  return Response.json({ error, ...extra }, { status });
}

type GuardResult =
  | { ok: true; supabase: Awaited<ReturnType<typeof createSupabaseSessionClient>> }
  | { ok: false; response: Response };

export async function guardAdminRequest(request: Request): Promise<GuardResult> {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return { ok: false, response: jsonError(403, "Cross-site requests are not allowed.") };
  }

  const admin = await getAdminStatus();
  if (admin.status === "unauthenticated") {
    return { ok: false, response: jsonError(401, "Not logged in.") };
  }
  if (admin.status === "forbidden") {
    return { ok: false, response: jsonError(403, "Admin access required.") };
  }

  // Queries with this client run as the logged-in admin, so RLS applies.
  return { ok: true, supabase: await createSupabaseSessionClient() };
}

// Reads a JSON request body; null if it isn't valid JSON.
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
