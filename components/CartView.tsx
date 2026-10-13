"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart";
import { copy } from "@/lib/copy";
import { formatPrice } from "@/lib/format";

const QUANTITY_OPTIONS = Array.from({ length: MAX_QUANTITY_PER_ITEM }, (_, i) => i + 1);

export function CartView() {
  const cart = useCart();

  if (cart.status === "loading") {
    return (
      <div className="mt-8 space-y-4">
        <p className="sr-only" role="status">{copy.cart.loading}</p>
        {[0, 1].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-stone-200" aria-hidden="true" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8">
      {cart.unavailableCount > 0 && (
        <div role="status" className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>{copy.cart.unavailableNotice(cart.unavailableCount)}</p>
          <button
            type="button"
            onClick={cart.removeUnavailable}
            className="mt-2 font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
          >
            {copy.cart.dismissNotice}
          </button>
        </div>
      )}

      {cart.lines.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 px-6 py-12 text-center">
          <p className="text-stone-700">{copy.cart.empty}</p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-md bg-stone-900 px-5 py-3 font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
          >
            {copy.cart.browseProducts}
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <ul className="divide-y divide-stone-200 border-y border-stone-200">
            {cart.lines.map((line) => {
              const { variant } = line;
              const quantityId = `quantity-${line.variantId}`;
              return (
                <li key={line.variantId} className="flex gap-4 py-4">
                  <Link
                    href={`/products/${variant.productSlug}`}
                    className="w-20 shrink-0 overflow-hidden rounded-md sm:w-24"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <ProductPlaceholder name={variant.productName} color={variant.placeholderColor} decorative showLabel={false} />
                  </Link>

                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-between">
                    <div>
                      <Link
                        href={`/products/${variant.productSlug}`}
                        className="font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
                      >
                        {variant.productName}
                      </Link>
                      <p className="text-sm text-stone-600">
                        {copy.cart.size}: {variant.size}
                      </p>
                      <p className="text-sm text-stone-600">
                        {formatPrice(variant.priceCents, variant.currency)} {copy.cart.each}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:justify-between">
                      <div className="flex items-center gap-2">
                        <label htmlFor={quantityId} className="sr-only">
                          {copy.cart.quantityFor(variant.productName, variant.size)}
                        </label>
                        <span className="text-sm text-stone-600" aria-hidden="true">
                          {copy.cart.quantity}
                        </span>
                        <select
                          id={quantityId}
                          value={line.quantity}
                          onChange={(event) => cart.updateQuantity(line.variantId, Number(event.target.value))}
                          className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-stone-900"
                        >
                          {QUANTITY_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="font-medium">{formatPrice(line.lineTotalCents, variant.currency)}</p>
                      <button
                        type="button"
                        onClick={() => cart.removeItem(line.variantId)}
                        aria-label={copy.cart.removeLabel(variant.productName, variant.size)}
                        className="text-sm text-stone-600 underline hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
                      >
                        {copy.cart.remove}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <section aria-labelledby="summary-heading" className="h-fit rounded-lg bg-stone-100 p-6">
            <h2 id="summary-heading" className="sr-only">
              {copy.cart.summary}
            </h2>
            <div className="flex justify-between text-lg font-semibold">
              <span>{copy.cart.subtotal}</span>
              <span>{formatPrice(cart.subtotalCents, cart.currency ?? "EUR")}</span>
            </div>
            <p className="mt-4 text-sm text-stone-600">{copy.cart.notAnOrder}</p>
            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-md bg-stone-900 px-5 py-3 text-center font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              {copy.cart.goToCheckout}
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
