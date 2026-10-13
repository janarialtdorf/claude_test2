"use client"; // Error boundaries must be Client Components

// Shown when the ROOT layout itself fails — for example if the product
// catalogue can't be loaded from the database for the header and cart.
// (app/error.tsx can't catch that, because it sits inside the root layout.)
// It replaces the whole page, so it needs its own <html> and <body>.

import { useEffect } from "react";
import { copy } from "@/lib/copy";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white px-4 font-sans text-stone-900">
        <title>{`${copy.error.title} | ${copy.brand.name}`}</title>
        <div className="text-center">
          <p className="text-xl font-semibold">{copy.brand.name}</p>
          <h1 className="mt-6 text-2xl font-semibold">{copy.error.title}</h1>
          <p className="mt-2 text-stone-600">{copy.error.text}</p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-6 rounded-md bg-stone-900 px-5 py-3 font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
          >
            {copy.error.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
