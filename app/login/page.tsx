import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: copy.auth.loginTitle,
  // Keep the staff login out of search engines.
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="text-3xl font-semibold tracking-tight">{copy.auth.loginTitle}</h1>
      <p className="mt-2 text-sm text-stone-600">{copy.auth.loginIntro}</p>
      {/* The form reads the URL (?error=...), which needs a Suspense boundary. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
