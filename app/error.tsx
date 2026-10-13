"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { copy } from "@/lib/copy";

// Shown if a page crashes while rendering. Users see a friendly message;
// the technical details go to the browser console, not the page.
export default function ErrorPage({
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
    <div className="py-12 text-center">
      <h1 className="text-2xl font-semibold">{copy.error.title}</h1>
      <p className="mt-2 text-stone-600">{copy.error.text}</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-md bg-stone-900 px-5 py-3 font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      >
        {copy.error.retry}
      </button>
    </div>
  );
}
