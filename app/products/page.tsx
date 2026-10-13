import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductGrid";
import { copy } from "@/lib/copy";
import { getAllProducts, getCategories, getProductsByCategory } from "@/lib/products";
import type { Category } from "@/types/product";

export const metadata: Metadata = {
  title: copy.listing.title,
};

// The page itself renders instantly. The filtered list depends on the URL
// (?category=...), which is only known at request time, so it sits inside
// <Suspense> and shows a skeleton while it loads.
export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{copy.listing.title}</h1>
      <Suspense
        fallback={
          <div className="mt-8">
            <p className="sr-only" role="status">{copy.listing.loading}</p>
            <ProductGridSkeleton />
          </div>
        }
      >
        <FilteredProducts searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FilteredProducts({
  searchParams,
}: {
  searchParams: PageProps<"/products">["searchParams"];
}) {
  const params = await searchParams;
  // A query value can be a string, a list (?category=a&category=b) or missing.
  // We only accept a single string and treat anything else as "no filter".
  const categorySlug = typeof params.category === "string" ? params.category : undefined;

  const categories = await getCategories();
  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const isUnknownCategory = categorySlug !== undefined && !activeCategory;
  const products = activeCategory
    ? await getProductsByCategory(activeCategory.slug)
    : await getAllProducts();

  return (
    <>
      <CategoryNav categories={categories} activeSlug={activeCategory?.slug} />

      {isUnknownCategory ? (
        <EmptyState message={copy.listing.unknownCategory} />
      ) : products.length === 0 ? (
        <EmptyState message={copy.listing.empty} />
      ) : (
        <>
          <p className="mb-4 text-sm text-stone-600">
            {copy.listing.resultCount(products.length)}
          </p>
          <ProductGrid products={products} />
        </>
      )}
    </>
  );
}

function CategoryNav({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  const items = [
    { href: "/products", label: copy.listing.allCategories, active: !activeSlug },
    ...categories.map((category) => ({
      href: `/products?category=${category.slug}`,
      label: category.name,
      active: category.slug === activeSlug,
    })),
  ];

  return (
    <nav aria-label={copy.listing.categoryNavLabel} className="my-6">
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              // aria-current tells screen readers which filter is selected.
              aria-current={item.active ? "page" : undefined}
              className={`inline-block rounded-full border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                item.active
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 text-stone-800 hover:border-stone-500"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 px-6 py-12 text-center">
      <p className="text-stone-700">{message}</p>
      <Link
        href="/products"
        className="mt-4 inline-block font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      >
        {copy.listing.showAll}
      </Link>
    </div>
  );
}
