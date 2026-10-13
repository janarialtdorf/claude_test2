// Creates a Supabase client for use on the SERVER only.
//
// `import "server-only"` makes the build fail if a client component ever
// imports this file, so database code can't accidentally end up in the
// browser bundle.

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabaseConfig();

  // The publishable key can only do what Row Level Security allows:
  // read published catalogue data. We don't use logins, so no sessions.
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
