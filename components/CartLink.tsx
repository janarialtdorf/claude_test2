"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { copy } from "@/lib/copy";

// Header link to the cart, with the number of items once the cart has loaded.
export function CartLink() {
  const { status, itemCount } = useCart();
  const showCount = status === "ready" && itemCount > 0;

  return (
    <Link
      href="/cart"
      aria-label={showCount ? copy.cart.linkLabelWithCount(itemCount) : copy.cart.linkLabel}
      className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-stone-900 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-stone-900"
    >
      {/* Shopping bag icon */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M6 7h12l-1 13H7L6 7z" strokeLinejoin="round" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      <span>{copy.cart.linkLabel}</span>
      {showCount && (
        <span className="min-w-5 rounded-full bg-stone-900 px-1.5 text-center text-xs leading-5 text-white" aria-hidden="true">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
