import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/product";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

// Grey boxes shown while products load, roughly matching the real grid layout.
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="aspect-[4/5] w-full animate-pulse rounded-md bg-stone-200" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-stone-200" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-stone-200" />
        </li>
      ))}
    </ul>
  );
}
