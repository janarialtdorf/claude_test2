"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { MessagePage } from "@/components/ui/MessagePage";
import { copy } from "@/lib/copy";
import { buttonPrimary } from "@/lib/styles";

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
    <MessagePage title={copy.error.title} text={copy.error.text}>
      <button type="button" onClick={() => retry()} className={buttonPrimary}>
        {copy.error.retry}
      </button>
    </MessagePage>
  );
}
