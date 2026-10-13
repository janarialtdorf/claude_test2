"use client";

// Two-step delete: the first click asks "are you sure?", the second deletes.
// (An in-page question instead of a browser pop-up, so it works well with
// keyboards and screen readers.)

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminErrorMessage } from "@/lib/admin-errors";
import { copy } from "@/lib/copy";

const text = copy.admin.delete;

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      if (response.status === 204) {
        router.push("/admin?deleted=1");
        router.refresh();
        return;
      }
      setError(adminErrorMessage(response.status));
    } catch {
      setError(copy.admin.form.errors.generic);
    }
    setDeleting(false);
  }

  return (
    <section className="mt-12 max-w-2xl rounded-lg border border-red-200 p-5">
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-800">{error}</p>
      )}
      {!confirming ? (
        <>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-md border border-red-400 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
          >
            {text.button}
          </button>
          <p className="mt-2 text-xs text-stone-500">{text.hint}</p>
        </>
      ) : (
        <div role="group" aria-labelledby="delete-question">
          <p id="delete-question" className="text-sm font-medium text-red-900">{text.confirmQuestion}</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 disabled:cursor-wait disabled:bg-red-400"
            >
              {deleting ? text.deleting : text.confirm}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              {text.cancel}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
