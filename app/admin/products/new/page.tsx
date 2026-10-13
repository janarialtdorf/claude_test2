import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminCategories } from "@/lib/admin-products";
import { requireAdminPage } from "@/lib/auth";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.admin.newProduct };
export const instant = false;

export default async function NewProductPage() {
  const admin = await requireAdminPage();
  const categories = await getAdminCategories();

  return (
    <div>
      <AdminHeader email={admin.email} />
      <Link href="/admin" className="text-sm text-stone-600 underline hover:text-stone-900">
        ← {copy.admin.backToProducts}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{copy.admin.newProduct}</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
