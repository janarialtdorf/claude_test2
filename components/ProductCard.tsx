import Link from "next/link";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { copy } from "@/lib/copy";
import { formatPrice } from "@/lib/format";
import { isProductAvailable } from "@/lib/products";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const available = isProductAvailable(product);

  return (
    // The whole card is one real link, so it works with keyboard and screen readers.
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900"
    >
      <div className="overflow-hidden rounded-md">
        <div className="transition-transform duration-300 group-hover:scale-[1.02]">
          <ProductPlaceholder name={product.name} color={product.placeholderColor} decorative />
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wide text-stone-500">{product.categoryName}</p>
        <h3 className="font-medium text-stone-900 group-hover:underline">{product.name}</h3>
        <p className="text-stone-700">
          {formatPrice(product.priceCents, product.currency)}
          {!available && (
            <span className="ml-2 text-sm font-medium text-red-700">{copy.product.soldOut}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
