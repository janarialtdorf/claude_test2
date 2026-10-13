import Link from "next/link";
import { buttonPrimary, focusRing } from "@/lib/styles";

// "Nothing here" box with a way forward, e.g. an empty cart or category.
// `actionStyle`: a big button, or a simple underlined link.
export function EmptyState({
  message,
  actionHref,
  actionLabel,
  actionStyle = "button",
}: {
  message: string;
  actionHref: string;
  actionLabel: string;
  actionStyle?: "button" | "link";
}) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 px-6 py-12 text-center">
      <p className="text-stone-700">{message}</p>
      <Link
        href={actionHref}
        className={
          actionStyle === "button"
            ? `${buttonPrimary} mt-6 inline-block`
            : `mt-4 inline-block font-medium underline ${focusRing}`
        }
      >
        {actionLabel}
      </Link>
    </div>
  );
}
