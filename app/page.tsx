import Link from "next/link";
import { ProductGrid } from "@/components/ProductGrid";
import { copy } from "@/lib/copy";
import { getCategories, getFeaturedProducts } from "@/lib/products";
import { buttonPrimary } from "@/lib/styles";

// Home page: brand intro, category links and featured products.
export default async function HomePage() {
  const [categories, featured] = await Promise.all([getCategories(), getFeaturedProducts()]);

  return (
    <div className="space-y-16">
      <section className="rounded-lg bg-stone-100 px-6 py-12 sm:px-12 sm:py-16">
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
          {copy.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-xl text-stone-700 sm:text-lg">{copy.home.heroText}</p>
        <Link
          href="/products"
          className={`${buttonPrimary} mt-8 inline-block`}
        >
          {copy.home.heroCta}
        </Link>
      </section>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight">
          {copy.home.categoriesTitle}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/products?category=${category.slug}`}
                className="block rounded-lg border border-stone-200 p-6 hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
              >
                <span className="text-lg font-medium">{category.name}</span>
                <span className="mt-1 block text-sm text-stone-600">{category.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="featured-heading">
        <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight">
          {copy.home.featuredTitle}
        </h2>
        <div className="mt-6">
          <ProductGrid products={featured} />
        </div>
      </section>
    </div>
  );
}
