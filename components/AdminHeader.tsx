import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { copy } from "@/lib/copy";

// Shown at the top of every admin page.
export function AdminHeader({ email }: { email: string | null }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-stone-100 px-4 py-3 text-sm">
      <p>
        <span className="font-semibold">{copy.admin.title}</span>
        {email && <span className="ml-2 text-stone-600">{copy.admin.signedInAs(email)}</span>}
      </p>
      <div className="flex items-center gap-4">
        <Link href="/" className="underline hover:text-stone-900">
          {copy.admin.backToShop}
        </Link>
        {/* A real form, so logging out works with a plain button. */}
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-stone-400 px-3 py-1.5 font-medium hover:bg-white focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            {copy.auth.logout}
          </button>
        </form>
      </div>
    </div>
  );
}
