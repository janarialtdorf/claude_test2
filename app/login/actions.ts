"use server";

// Log in / log out, using Supabase Auth. Supabase checks the password hash
// and rate-limits login attempts; we never see or store passwords ourselves.

import { redirect } from "next/navigation";
import { z } from "zod";
import { copy } from "@/lib/copy";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

const errors = copy.auth.errors;

const loginSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(1).max(200),
});

export type LoginState = { error: string | null; email: string };

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const emailText = typeof email === "string" ? email.trim() : "";

  const parsed = loginSchema.safeParse({ email: emailText, password });
  if (!parsed.success) return { error: errors.invalidInput, email: emailText };

  const supabase = await createSupabaseSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Same message for "no such user" and "wrong password", so the form
    // can't be used to find out which emails have accounts.
    if (error.status === 429) return { error: errors.tooManyAttempts, email: emailText };
    if (error.status === 400) return { error: errors.invalidCredentials, email: emailText };
    console.error("Login failed:", error.status, error.code);
    return { error: errors.generic, email: emailText };
  }

  // Logged in — but only admins have any use for an account here.
  // We look the role up by the user ID that sign-in just returned. (The new
  // login cookie isn't readable yet within this same request, so a query
  // "as the logged-in user" would still run as an anonymous visitor.)
  const { data: profile, error: roleError } = await createSupabaseAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (roleError) console.error("Role lookup failed:", roleError.code, roleError.message);
  if (roleError || profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: errors.notAdmin, email: emailText };
  }

  // redirect() works by throwing, so it must stay outside try/catch.
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
