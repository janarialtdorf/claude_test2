"use client";

// Size picker + "Add to cart" button on the product page.
// Sizes are real radio buttons (hidden visually, styled as pills via their
// <label>), so keyboard users can pick a size with Tab and the arrow keys.

import Link from "next/link";
import { useId, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart";
import { copy } from "@/lib/copy";
import type { Size } from "@/types/product";
import { buttonPrimary } from "@/lib/styles";

export interface SizeOption {
  variantId: string;
  size: Size;
  available: boolean;
}

type Feedback =
  | { kind: "error"; message: string }
  | { kind: "success"; message: string }
  | null;

export function AddToCart({ productName, sizes }: { productName: string; sizes: SizeOption[] }) {
  const { addItem } = useCart();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const feedbackId = useId();

  const anyAvailable = sizes.some((option) => option.available);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const selected = sizes.find((option) => option.variantId === selectedId);

    if (!selected) {
      setFeedback({ kind: "error", message: copy.addToCart.selectSizeError });
      return;
    }

    const result = addItem(selected.variantId);
    if (result === "added") {
      setFeedback({ kind: "success", message: copy.addToCart.added(productName, selected.size) });
    } else if (result === "limit_reached") {
      setFeedback({ kind: "error", message: copy.addToCart.limitReached(MAX_QUANTITY_PER_ITEM) });
    } else {
      setFeedback({ kind: "error", message: copy.product.soldOut });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8" noValidate>
      <fieldset aria-describedby={feedback?.kind === "error" ? feedbackId : undefined}>
        <legend className="text-sm font-medium">{copy.addToCart.sizeLegend}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizes.map((option) => (
            <label key={option.variantId} className="relative">
              <input
                type="radio"
                name="size"
                value={option.variantId}
                checked={selectedId === option.variantId}
                disabled={!option.available}
                onChange={() => {
                  setSelectedId(option.variantId);
                  setFeedback(null);
                }}
                className="peer sr-only"
              />
              <span
                className={`block min-w-12 cursor-pointer rounded-md border px-3 py-2 text-center text-sm
                  border-stone-400 text-stone-900 hover:border-stone-900
                  peer-checked:border-stone-900 peer-checked:bg-stone-900 peer-checked:text-white
                  peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-stone-900
                  peer-disabled:cursor-not-allowed peer-disabled:border-stone-200 peer-disabled:bg-stone-50
                  peer-disabled:text-stone-400 peer-disabled:line-through`}
              >
                {option.size}
                {!option.available && (
                  <span className="sr-only"> ({copy.addToCart.sizeSoldOut})</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {anyAvailable ? (
        <button
          type="submit"
          className={`${buttonPrimary} mt-6 w-full sm:w-auto`}
        >
          {copy.addToCart.button}
        </button>
      ) : (
        <p className="mt-6 font-medium text-red-700">{copy.addToCart.productSoldOut}</p>
      )}

      {/* aria-live: screen readers announce this text when it changes */}
      <div id={feedbackId} aria-live="polite" className="mt-4 min-h-6 text-sm">
        {feedback?.kind === "error" && <p className="text-red-700">{feedback.message}</p>}
        {feedback?.kind === "success" && (
          <p className="text-green-800">
            {feedback.message}{" "}
            <Link href="/cart" className="font-medium underline">
              {copy.addToCart.viewCart}
            </Link>
          </p>
        )}
      </div>

      {anyAvailable && <p className="mt-2 text-xs text-stone-500">{copy.addToCart.demoNote}</p>}
    </form>
  );
}
