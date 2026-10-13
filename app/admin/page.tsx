import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { getAdminProducts } from "@/lib/admin-products";
import { requireAdminPage } from "@/lib/auth";
import { copy } from "@/lib/copy";
import { formatPrice } from "@/lib/format";
import { buttonPrimarySmall } from "@/lib/styles";
import { Alert } from "@/components/ui/Alert";

// Rendered per request for the logged-in admin (see app/admin/layout.tsx).
export const instant = false;

const text = copy.admin;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin">) {
  // Checked on the server for every request: not logged in → /login,
  // logged in but not an admin → /login?error=forbidden.
  const admin = await requireAdminPage();
  const [products, params] = await Promise.all([getAdminProducts(), searchParams]);
  const notice = params.deleted === "1" ? text.deleted : null;

  return (
    <div>
      <AdminHeader email={admin.email} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{text.productsTitle}</h1>
        <Link
          href="/admin/products/new"
          className={`${buttonPrimarySmall}`}
        >
          {text.newProduct}
        </Link>
      </div>

      {notice && (
        <Alert kind="success" className="mt-4">
          {notice}
        </Alert>
      )}

      {products.length === 0 ? (
        <p className="mt-8 text-stone-600">{text.noProducts}</p>
      ) : (
        // On small screens the table scrolls sideways inside its own box.
        <div className="mt-6 overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{text.table.name}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.table.category}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.table.price}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.table.stock}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.table.status}</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">{text.table.edit}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">{product.categoryName}</td>
                  <td className="px-4 py-3">{formatPrice(product.priceCents, product.currency)}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {product.sizes.map((s) => `${s.size} ${s.stockQuantity}`).join(" · ")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.isPublished ? "text-green-800" : "text-stone-500"}>
                      {product.isPublished ? text.table.published : text.table.hidden}
                    </span>
                    {product.featured && <span className="ml-2 text-stone-600">· {text.table.featured}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
                      aria-label={`${text.table.edit} ${product.name}`}
                    >
                      {text.table.edit}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
