import Link from "next/link";
import { copy } from "@/lib/copy";

// Shown when a product page calls notFound(), e.g. /products/does-not-exist.
export default function ProductNotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-2xl font-semibold">{copy.notFound.productTitle}</h1>
      <p className="mt-2 text-stone-600">{copy.notFound.productText}</p>
      <Link
        href="/products"
        className="mt-6 inline-block rounded-md bg-stone-900 px-5 py-3 font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      >
        {copy.notFound.browseProducts}
      </Link>
    </div>
  );
}
