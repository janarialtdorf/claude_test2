import { AdminHeader } from "@/components/AdminHeader";
import { requireAdminPage } from "@/lib/auth";
import { copy } from "@/lib/copy";

// Rendered per request for the logged-in admin (see app/admin/layout.tsx).
export const instant = false;

export default async function AdminHomePage() {
  // Checked on the server for every request: not logged in → /login,
  // logged in but not an admin → /login?error=forbidden.
  const admin = await requireAdminPage();

  return (
    <div>
      <AdminHeader email={admin.email} />
      <h1 className="text-3xl font-semibold tracking-tight">{copy.admin.title}</h1>
      <p className="mt-2 text-stone-700">{copy.admin.welcome}</p>
    </div>
  );
}
