import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/AdminHeader";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { UUID_PATTERN } from "@/lib/admin-api";
import { getAdminCategories, getAdminProduct } from "@/lib/admin-products";
import { requireAdminPage } from "@/lib/auth";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.admin.editProduct };
export const instant = false;

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const admin = await requireAdminPage();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!UUID_PATTERN.test(id)) notFound();

  const [product, categories] = await Promise.all([getAdminProduct(id), getAdminCategories()]);
  if (!product) notFound();

  return (
    <div>
      <AdminHeader email={admin.email} />
      <Link href="/admin" className="text-sm text-stone-600 underline hover:text-stone-900">
        ← {copy.admin.backToProducts}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{product.name}</h1>
      {query.created === "1" && (
        <p role="status" className="mt-4 max-w-2xl rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
          {copy.admin.created}
        </p>
      )}
      {/* key: re-create the form after a save so it shows the saved values */}
      <ProductForm
        key={JSON.stringify(product)}
        categories={categories}
        initial={product}
        productId={product.id}
        productSlug={product.slug}
      />
      <DeleteProductButton productId={product.id} />
    </div>
  );
}
