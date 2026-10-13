// Server-side checks for "who is this, and are they an admin?".
// Every admin page and admin endpoint calls one of these. Hiding links in
// the UI is NOT access control — these checks are.

import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

export type AdminStatus =
  | { status: "admin"; userId: string; email: string | null }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

export async function getAdminStatus(): Promise<AdminStatus> {
  // "Only run this for a real request." Without it, Next.js may try to
  // pre-render admin pages ahead of time, where reading the clock (which
  // the login check does) isn't allowed.
  await connection();
  const supabase = await createSupabaseSessionClient();

  // getClaims() verifies the login token. A missing or invalid token
  // means "not logged in".
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return { status: "unauthenticated" };

  // Ask the database (the same is_admin() the database rules use).
  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError) {
    // If we can't confirm the role, refuse access rather than allow it.
    console.error("is_admin check failed:", roleError.code, roleError.message);
    return { status: "forbidden" };
  }
  if (isAdmin !== true) return { status: "forbidden" };

  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { status: "admin", userId, email };
}

// For admin PAGES: returns the admin, or redirects to the login page.
export async function requireAdminPage() {
  const result = await getAdminStatus();
  if (result.status === "unauthenticated") redirect("/login");
  if (result.status === "forbidden") redirect("/login?error=forbidden");
  return result;
}
