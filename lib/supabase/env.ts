// Reads the Supabase settings from environment variables (see .env.example)
// in one place, with one clear error message if they're missing.

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase settings. Copy .env.example to .env.local and fill in your project's values.",
    );
  }
  return { url, publishableKey };
}

// (The SECRET key is read only in lib/supabase/admin.ts, which is server-only.)
