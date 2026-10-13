// Shared Tailwind class names for elements that appear in many places, so
// they look the same everywhere and can be restyled in one spot.
// Spacing and width (mt-6, w-full, …) stay at each usage, because they
// depend on where the element sits.

// Visible keyboard focus outline (accessibility).
export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900";

// Main call-to-action button or link ("Add to cart", "Place demo order", …).
// The disabled styles only apply to <button>s while they're busy.
export const buttonPrimary = `rounded-md bg-stone-900 px-5 py-3 font-medium text-white hover:bg-stone-700 ${focusRing} disabled:cursor-wait disabled:bg-stone-500`;

// Smaller version for admin toolbars.
export const buttonPrimarySmall = `rounded-md bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700 ${focusRing} disabled:cursor-wait disabled:bg-stone-500`;

// Standard text input below its label.
export const inputField =
  "mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-stone-900";
