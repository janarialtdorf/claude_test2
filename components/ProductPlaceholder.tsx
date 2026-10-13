import { copy } from "@/lib/copy";

// Shown instead of a product photo, because we don't have licensed images yet.
// When `decorative` is true (e.g. in a card that already shows the name),
// screen readers skip it to avoid reading the product name twice.
export function ProductPlaceholder({
  name,
  color,
  decorative = false,
}: {
  name: string;
  color: string;
  decorative?: boolean;
}) {
  return (
    <div
      className="flex aspect-[4/5] w-full items-end justify-start p-3"
      style={{ backgroundColor: color }}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": copy.product.placeholderImage(name) })}
    >
      <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-800">
        {copy.product.demoLabel}
      </span>
    </div>
  );
}
