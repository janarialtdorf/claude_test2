import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/AdminHeader";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { ImageGalleryManager } from "@/components/admin/ImageGalleryManager";
import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminCategories, getAdminProduct } from "@/lib/admin-products";
import { requireAdminPage } from "@/lib/auth";
import { copy } from "@/lib/copy";
import { isUuid } from "@/lib/validation";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = { title: copy.admin.editProduct };
export const instant = false;

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const admin = await requireAdminPage();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();

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
        <Alert kind="success" className="mt-4 max-w-2xl">
          {copy.admin.created}{" "}
          <a href="#images-heading" className="font-medium underline">
            {copy.admin.addImagesLink}
          </a>
        </Alert>
      )}
      {/* key: re-create the form after a save so it shows the saved values
          (images are left out, so uploading one doesn't reset unsaved edits) */}
      <ProductForm
        key={JSON.stringify({ ...product, images: undefined })}
        categories={categories}
        initial={product}
        productId={product.id}
        productSlug={product.slug}
      />
      <ImageGalleryManager productId={product.id} images={product.images} />
      <DeleteProductButton productId={product.id} />
    </div>
  );
}
