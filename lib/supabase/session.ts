// Supabase client that knows WHO is making the request, via login cookies.
// Use it in Server Components, Server Actions and Route Handlers that need
// the logged-in user (admin pages and admin API).
//
// Uses the publishable key, so every query runs as that user and Row Level
// Security applies — an admin's session can do admin things, nobody else's can.

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createSupabaseSessionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase settings. See .env.example.");
  }

  const cookieStore = await cookies();

  // A new client per request — never share one between users.
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies. That's fine: proxy.ts
          // refreshes the session cookies before the page renders.
        }
      },
    },
  });
}
