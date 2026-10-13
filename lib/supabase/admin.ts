// Supabase client using the SECRET key — server only.
//
// The secret key bypasses Row Level Security, so it can do anything in the
// database. That's why:
//   * its variable name has no NEXT_PUBLIC_ prefix (Next.js never sends it to the browser),
//   * this file imports "server-only" (the build fails if browser code imports it),
//   * we use it only for a few server tasks that must work without a
//     logged-in admin: placing orders, rate limiting, and looking up a
//     user's role during login.

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient() {
  const { url } = getSupabaseConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing Supabase secret key. Add SUPABASE_SECRET_KEY to .env.local (see .env.example).");
  }
  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
