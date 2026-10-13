"use client";

// Admin gallery manager on the product edit page: upload images, edit alt
// text, choose the main image, delete images. Every action calls the admin
// API; the server checks the login, role, file type and size again.

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminProductImage } from "@/lib/admin-products";
import { copy } from "@/lib/copy";

const text = copy.admin.images;
const MAX_IMAGES = 8;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Message = { kind: "error" | "success"; text: string } | null;

function errorFor(status: number, body: { error?: string }): string {
  const errors = copy.admin.form.errors;
  if (status === 401) return errors.sessionExpired;
  if (status === 403) return errors.forbidden;
  if (status === 404) return errors.notFound;
  return body.error ?? errors.generic;
}

export function ImageGalleryManager({ productId, images }: { productId: string; images: AdminProductImage[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState(false);
  const full = images.length >= MAX_IMAGES;

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");

    // Quick checks in the browser for faster feedback (the server re-checks).
    if (!(file instanceof File) || file.size === 0) return setMessage({ kind: "error", text: text.errors.noFile });
    if (file.size > MAX_BYTES) return setMessage({ kind: "error", text: text.errors.tooLarge });
    if (!ACCEPTED_TYPES.includes(file.type)) return setMessage({ kind: "error", text: text.errors.wrongType });
    if (String(form.get("altText") ?? "").trim() === "") {
      return setMessage({ kind: "error", text: text.errors.altRequired });
    }

    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (response.status === 201) {
        formElement.reset();
        setMessage({ kind: "success", text: text.uploaded });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: errorFor(response.status, body) });
      }
    } catch {
      setMessage({ kind: "error", text: copy.admin.form.errors.generic });
    }
    setBusy(false);
  }

  async function update(imageId: string, changes: { altText?: string; makeMain?: true }, successText: string) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        setMessage({ kind: "success", text: successText });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: errorFor(response.status, body) });
      }
    } catch {
      setMessage({ kind: "error", text: copy.admin.form.errors.generic });
    }
    setBusy(false);
  }

  async function remove(imageId: string) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, { method: "DELETE" });
      if (response.status === 204) {
        setMessage({ kind: "success", text: text.deleted });
        router.refresh();
      } else {
        const body = await response.json().catch(() => ({}));
        setMessage({ kind: "error", text: errorFor(response.status, body) });
      }
    } catch {
      setMessage({ kind: "error", text: copy.admin.form.errors.generic });
    }
    setBusy(false);
  }

  return (
    <section aria-labelledby="images-heading" className="mt-12 max-w-2xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="images-heading" className="text-xl font-semibold">{text.title}</h2>
        <p className="text-sm text-stone-600">{text.count(images.length, MAX_IMAGES)}</p>
      </div>
      <p className="mt-1 text-xs text-stone-500">{text.hint}</p>

      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`mt-4 rounded-md border px-4 py-3 text-sm ${
            message.kind === "error"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-green-300 bg-green-50 text-green-900"
          }`}
        >
          {message.text}
        </p>
      )}

      {images.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">{text.none}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {images.map((image, index) => (
            <ImageRow
              key={`${image.id}-${image.altText}`}
              image={image}
              position={index + 1}
              isMain={index === 0}
              busy={busy}
              onSaveAlt={(altText) => update(image.id, { altText }, text.altSaved)}
              onMakeMain={() => update(image.id, { makeMain: true }, text.madeMain)}
              onDelete={() => remove(image.id)}
            />
          ))}
        </ul>
      )}

      {full ? (
        <p className="mt-6 text-sm text-stone-600">{text.limitReached}</p>
      ) : (
        <form onSubmit={upload} className="mt-6 space-y-4 rounded-lg border border-stone-200 p-4" noValidate>
          <div>
            <label htmlFor="image-file" className="block text-sm font-medium">{text.file}</label>
            <input
              id="image-file"
              name="file"
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border file:border-stone-300 file:bg-white file:px-3 file:py-1.5"
            />
          </div>
          <div>
            <label htmlFor="image-alt" className="block text-sm font-medium">{text.altText}</label>
            <input
              id="image-alt"
              name="altText"
              type="text"
              maxLength={300}
              aria-describedby="image-alt-hint"
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-stone-900"
            />
            <p id="image-alt-hint" className="mt-1 text-xs text-stone-500">{text.altHint}</p>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-wait disabled:bg-stone-500"
          >
            {busy ? text.uploading : text.upload}
          </button>
        </form>
      )}
    </section>
  );
}

function ImageRow({
  image,
  position,
  isMain,
  busy,
  onSaveAlt,
  onMakeMain,
  onDelete,
}: {
  image: AdminProductImage;
  position: number;
  isMain: boolean;
  busy: boolean;
  onSaveAlt: (altText: string) => void;
  onMakeMain: () => void;
  onDelete: () => void;
}) {
  const [alt, setAlt] = useState(image.altText);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const altId = `alt-${image.id}`;

  return (
    <li className="flex gap-4 rounded-lg border border-stone-200 p-3">
      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-md bg-stone-100">
        <Image src={image.url} alt={image.altText} fill sizes="96px" className="object-cover" />
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">
          {position}.{" "}
          {isMain && <span className="rounded-full bg-stone-900 px-2 py-0.5 text-xs text-white">{text.main}</span>}
        </p>
        <div>
          <label htmlFor={altId} className="block text-xs font-medium text-stone-600">{text.altText}</label>
          <div className="mt-1 flex flex-wrap gap-2">
            <input
              id={altId}
              type="text"
              value={alt}
              maxLength={300}
              onChange={(e) => setAlt(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-stone-300 px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-stone-900"
            />
            <button
              type="button"
              disabled={busy || alt.trim() === "" || alt === image.altText}
              onClick={() => onSaveAlt(alt)}
              className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400 focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              {text.saveAlt}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isMain && (
            <button
              type="button"
              disabled={busy}
              onClick={onMakeMain}
              className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              {text.makeMain}
            </button>
          )}
          {!confirmingDelete ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingDelete(true)}
              className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-800 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-800"
            >
              {text.delete}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onDelete}
                className="rounded-md bg-red-700 px-3 py-1 text-sm text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-red-800"
              >
                {text.confirmDelete}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-stone-900"
              >
                {text.cancel}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
