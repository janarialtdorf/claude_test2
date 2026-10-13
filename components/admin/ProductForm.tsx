"use client";

// Create/edit form for a product. It sends JSON to the admin API
// (POST /api/admin/products or PATCH /api/admin/products/[id]); the server
// validates everything again and decides what's allowed.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_STOCK, type ProductField, SIZES } from "@/lib/admin-product-schema";
import { copy } from "@/lib/copy";
import { centsToEuroInput, parseEuroToCents } from "@/lib/money";
import type { Size } from "@/types/product";

const text = copy.admin.form;

export interface ProductFormValues {
  name: string;
  description: string;
  priceCents: number;
  categoryId: string;
  colorName: string;
  placeholderColor: string;
  featured: boolean;
  isPublished: boolean;
  sizes: { size: Size; stockQuantity: number }[];
}

type FieldErrors = Partial<Record<ProductField, string>>;

export function ProductForm({
  categories,
  initial,
  productId,
  productSlug,
}: {
  categories: { id: string; name: string }[];
  initial?: ProductFormValues; // missing = creating a new product
  productId?: string;
  productSlug?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(productId);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  // Which sizes are offered, and their stock (kept as text while typing).
  const [sizeState, setSizeState] = useState(() =>
    SIZES.map((size) => {
      const existing = initial?.sizes.find((s) => s.size === size);
      return { size, offered: Boolean(existing), stock: String(existing?.stockQuantity ?? 0) };
    }),
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const priceCents = parseEuroToCents(String(form.get("price") ?? ""));

    const payload = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      // Invalid prices are sent as null so the server reports them.
      priceCents,
      categoryId: String(form.get("categoryId") ?? ""),
      colorName: String(form.get("colorName") ?? ""),
      placeholderColor: String(form.get("placeholderColor") ?? ""),
      featured: form.get("featured") === "on",
      isPublished: form.get("isPublished") === "on",
      sizes: sizeState
        .filter((s) => s.offered)
        .map((s) => ({ size: s.size, stockQuantity: s.stock.trim() === "" ? NaN : Number(s.stock) })),
    };

    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      const response = await fetch(isEdit ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        // NaN isn't valid JSON; it becomes null and the server rejects it.
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));

      if (response.status === 201) {
        router.push(`/admin/products/${body.id}?created=1`);
        return;
      }
      if (response.ok) {
        setMessage({ kind: "success", text: copy.admin.saved });
        router.refresh();
      } else if (response.status === 400) {
        setFieldErrors(body.fieldErrors ?? {});
        setMessage({ kind: "error", text: text.errors.fixFields });
      } else if (response.status === 401) {
        setMessage({ kind: "error", text: text.errors.sessionExpired });
      } else if (response.status === 403) {
        setMessage({ kind: "error", text: text.errors.forbidden });
      } else if (response.status === 404) {
        setMessage({ kind: "error", text: text.errors.notFound });
      } else {
        setMessage({ kind: "error", text: text.errors.generic });
      }
    } catch {
      setMessage({ kind: "error", text: text.errors.generic });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 max-w-2xl space-y-6">
      {message && (
        <div
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-md border px-4 py-3 text-sm ${
            message.kind === "error"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-green-300 bg-green-50 text-green-900"
          }`}
        >
          {message.text}
          {message.kind === "error" && message.text === text.errors.sessionExpired && (
            <Link href="/login" className="ml-2 font-medium underline">
              {copy.auth.submit}
            </Link>
          )}
        </div>
      )}

      <TextField name="name" label={text.name} defaultValue={initial?.name} error={fieldErrors.name} required />

      <div>
        <label htmlFor="description" className="block text-sm font-medium">{text.description}</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description}
          aria-invalid={fieldErrors.description ? true : undefined}
          aria-describedby={fieldErrors.description ? "description-error" : undefined}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-stone-900"
        />
        <FieldError id="description-error" error={fieldErrors.description} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          name="price"
          label={text.price}
          hint={text.priceHint}
          inputMode="decimal"
          defaultValue={initial ? centsToEuroInput(initial.priceCents) : ""}
          error={fieldErrors.priceCents}
          required
        />
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium">{text.category}</label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={initial?.categoryId ?? ""}
            aria-invalid={fieldErrors.categoryId ? true : undefined}
            aria-describedby={fieldErrors.categoryId ? "categoryId-error" : undefined}
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            <option value="" disabled>—</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <FieldError id="categoryId-error" error={fieldErrors.categoryId} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="colorName" label={text.colorName} defaultValue={initial?.colorName} error={fieldErrors.colorName} />
        <div>
          <label htmlFor="placeholderColor" className="block text-sm font-medium">{text.placeholderColor}</label>
          <input
            id="placeholderColor"
            name="placeholderColor"
            type="color"
            defaultValue={initial?.placeholderColor ?? "#e7e5e4"}
            aria-describedby="placeholderColor-hint"
            className="mt-1 h-10 w-20 cursor-pointer rounded-md border border-stone-300 bg-white p-1 focus-visible:outline-2 focus-visible:outline-stone-900"
          />
          <p id="placeholderColor-hint" className="mt-1 text-xs text-stone-500">{text.placeholderColorHint}</p>
          <FieldError id="placeholderColor-error" error={fieldErrors.placeholderColor} />
        </div>
      </div>

      <fieldset aria-describedby={fieldErrors.sizes ? "sizes-hint sizes-error" : "sizes-hint"}>
        <legend className="text-sm font-medium">{text.sizes}</legend>
        <p id="sizes-hint" className="mt-1 text-xs text-stone-500">{text.sizesHint}</p>
        <div className="mt-3 space-y-2">
          {sizeState.map((row, index) => (
            <div key={row.size} className="flex items-center gap-4">
              <label className="flex w-28 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.offered}
                  onChange={(e) =>
                    setSizeState((rows) => rows.map((r, i) => (i === index ? { ...r, offered: e.target.checked } : r)))
                  }
                  aria-label={text.offered(row.size)}
                  className="h-4 w-4"
                />
                <span aria-hidden="true">{row.size}</span>
              </label>
              <input
                type="number"
                min={0}
                max={MAX_STOCK}
                step={1}
                value={row.stock}
                disabled={!row.offered}
                onChange={(e) =>
                  setSizeState((rows) => rows.map((r, i) => (i === index ? { ...r, stock: e.target.value } : r)))
                }
                aria-label={text.stockFor(row.size)}
                className="w-28 rounded-md border border-stone-300 px-3 py-1.5 text-sm disabled:bg-stone-100 disabled:text-stone-400 focus-visible:outline-2 focus-visible:outline-stone-900"
              />
            </div>
          ))}
        </div>
        <FieldError id="sizes-error" error={fieldErrors.sizes} />
      </fieldset>

      <div className="space-y-2">
        <Checkbox name="isPublished" label={text.isPublished} defaultChecked={initial?.isPublished ?? false} />
        <Checkbox name="featured" label={text.featured} defaultChecked={initial?.featured ?? false} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-stone-900 px-5 py-3 font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-wait disabled:bg-stone-500"
        >
          {saving ? text.saving : isEdit ? text.save : text.create}
        </button>
        {isEdit && productSlug && (
          <Link href={`/products/${productSlug}`} className="text-sm underline">
            {text.viewInShop}
          </Link>
        )}
      </div>
    </form>
  );
}

function TextField({
  name,
  label,
  hint,
  defaultValue,
  error,
  required = false,
  inputMode,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
  inputMode?: "decimal";
}) {
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(" ");
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">{label}</label>
      <input
        id={name}
        name={name}
        type="text"
        inputMode={inputMode}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-2 focus-visible:outline-stone-900 ${
          error ? "border-red-600" : "border-stone-300"
        }`}
      />
      {hint && <p id={`${name}-hint`} className="mt-1 text-xs text-stone-500">{hint}</p>}
      <FieldError id={`${name}-error`} error={error} />
    </div>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />
      {label}
    </label>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return <p id={id} className="mt-1 text-sm text-red-700">{error}</p>;
}
