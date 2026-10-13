import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { copy } from "@/lib/copy";
import { formatPrice } from "@/lib/format";
import {
  getAllProducts,
  getCategoryBySlug,
  getProductBySlug,
  isProductAvailable,
} from "@/lib/products";
import type { Product } from "@/types/product";

// Tells Next.js every product slug at build time, so each product page can be
// pre-built as static HTML. Unknown slugs are handled below with notFound().
export function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return { title: product ? product.name : copy.notFound.productTitle };
}

// We read `params` at the top of the page (no <Suspense>), so an unknown slug
// can still answer with a real 404 status code. Next.js would otherwise warn
// that this page "blocks" navigation; `instant = false` says that's intended.
// Known products are pre-built by generateStaticParams, so they stay fast.
export const instant = false;

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  // Shows app/products/[slug]/not-found.tsx with a 404 status.
  if (!product) notFound();

  return (
    <div>
      <Link
        href="/products"
        className="text-sm text-stone-600 hover:text-stone-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      >
        ← {copy.product.backToProducts}
      </Link>
      <ProductDetails product={product} />
    </div>
  );
}

function ProductDetails({ product }: { product: Product }) {
  const category = getCategoryBySlug(product.categorySlug);
  const available = isProductAvailable(product);

  return (
    <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
      <div className="overflow-hidden rounded-lg">
        <ProductPlaceholder name={product.name} color={product.placeholderColor} />
      </div>

      <div>
        {category && (
          <Link
            href={`/products?category=${category.slug}`}
            className="text-sm uppercase tracking-wide text-stone-500 hover:text-stone-900 hover:underline"
          >
            {category.name}
          </Link>
        )}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-3 text-2xl text-stone-800">
          {formatPrice(product.priceCents, product.currency)}
        </p>
        <p className={`mt-2 text-sm font-medium ${available ? "text-green-800" : "text-red-700"}`}>
          {available ? copy.product.available : copy.product.soldOut}
        </p>

        <p className="mt-6 text-stone-700">{product.description}</p>

        <dl className="mt-6 text-sm">
          <dt className="inline font-medium">{copy.product.color}: </dt>
          <dd className="inline text-stone-700">{product.colorName}</dd>
        </dl>

        <AddToCart
          productName={product.name}
          sizes={product.variants.map((variant) => ({
            variantId: variant.id,
            size: variant.size,
            available: variant.availability === "in_stock",
          }))}
        />
      </div>
    </div>
  );
}
