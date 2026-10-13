// Next.js Proxy (called "middleware" before Next.js 16): runs before matching
// requests. Its only job here is to keep the login session fresh — Supabase's
// short-lived access token is renewed and the new cookies are written onto
// the response.
//
// It does NOT decide who may see what. Every admin page and endpoint checks
// the user's role on the server itself (lib/auth.ts), and the database
// checks again with Row Level Security.

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Pass the refreshed cookies on to the page (request) and to the
          // browser (response), plus the no-cache headers Supabase asks for.
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Validates the token and refreshes it if needed. (Never trust
  // getSession() on the server — it doesn't validate anything.)
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  // Only routes that use logins. The storefront doesn't, so it stays fast
  // and fully cached.
  matcher: ["/login", "/admin/:path*", "/api/admin/:path*"],
};
