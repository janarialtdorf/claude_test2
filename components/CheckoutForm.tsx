"use client";

// Checkout: order summary + delivery form, and the confirmation afterwards.
//
// useActionState connects the form to the Server Action placeDemoOrder:
//   * `state`   – what the server returned last (errors or confirmation)
//   * `action`  – passed to <form action>, sends the form to the server
//   * `pending` – true while the server is working
// The cart travels as a hidden field containing only IDs and quantities.

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { type CheckoutState, placeDemoOrder } from "@/app/checkout/actions";
import { useCart } from "@/components/CartProvider";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { DELIVERY_COUNTRIES, type CustomerField } from "@/lib/checkout";
import { copy } from "@/lib/copy";
import { formatPrice } from "@/lib/format";
import { buttonPrimary } from "@/lib/styles";

const text = copy.checkout;
const initialState: CheckoutState = { status: "idle" };

export function CheckoutForm() {
  const cart = useCart();
  const [state, action, pending] = useActionState(placeDemoOrder, initialState);

  // Guard against double submits. `pending` only updates after React
  // re-renders, so two very fast clicks could both get through. A ref
  // changes immediately, so the second click sees it straight away.
  const submittingRef = useRef(false);
  useEffect(() => {
    if (!pending) submittingRef.current = false;
  }, [pending]);

  // Item names at the moment of submitting. If the server says an item is
  // out of stock, the refreshed cart hides that item — so we keep its name
  // here to still be able to tell the shopper which one it was.
  const [submittedLabels, setSubmittedLabels] = useState(() => new Map<string, string>());

  // After a successful order, empty the cart (it's now an order).
  const succeeded = state.status === "success";
  const { clearCart } = cart;
  useEffect(() => {
    if (succeeded) clearCart();
  }, [succeeded, clearCart]);

  if (state.status === "success") return <Confirmation order={state.order} />;

  const errorState = state.status === "error" ? state : null;
  const errorAlert = errorState && (
    <ErrorAlert
      state={errorState}
      unavailableNames={errorState.unavailableVariantIds
        .map((id) => submittedLabels.get(id))
        .filter((name): name is string => Boolean(name))}
    />
  );

  if (cart.status === "loading") {
    return (
      <div className="mt-8 h-64 animate-pulse rounded-lg bg-stone-200" aria-hidden="true" />
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mt-8">
        {/* Still explain a failed order if it just emptied the cart. */}
        {errorAlert}
        <div className="mt-4">
          <EmptyState message={text.emptyCart} actionHref="/products" actionLabel={copy.cart.browseProducts} />
        </div>
      </div>
    );
  }

  const itemsJson = JSON.stringify(
    cart.lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
  );
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
      <form
        action={action}
        // Ignore extra submits (double-click, Enter) while an order is being placed.
        // preventDefault() stops React from running the action again.
        onSubmit={(event) => {
          if (submittingRef.current) {
            event.preventDefault();
            return;
          }
          submittingRef.current = true;
          setSubmittedLabels(new Map(
            cart.lines.map((line) => [
              line.variantId,
              `${line.variant.productName} (${copy.cart.size} ${line.variant.size})`,
            ]),
          ));
        }}
        noValidate
        aria-describedby={errorState ? "checkout-form-error" : undefined}
      >
        <input type="hidden" name="items" value={itemsJson} />

        <h2 className="text-xl font-semibold">{text.detailsTitle}</h2>

        {errorAlert}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field name="customerName" autoComplete="name" state={errorState} className="sm:col-span-2" />
          <Field name="email" type="email" autoComplete="email" state={errorState} className="sm:col-span-2" />
          <Field name="addressLine1" autoComplete="address-line1" state={errorState} className="sm:col-span-2" />
          <Field name="addressLine2" autoComplete="address-line2" state={errorState} optional className="sm:col-span-2" />
          <Field name="city" autoComplete="address-level2" state={errorState} />
          <Field
            name="postalCode"
            autoComplete="postal-code"
            inputMode="numeric"
            hint={text.postalCodeHint}
            state={errorState}
          />
          <div className="sm:col-span-2">
            <label htmlFor="country" className="block text-sm font-medium">
              {text.fields.country}
            </label>
            <select
              id="country"
              name="country"
              autoComplete="country"
              defaultValue={errorState?.values.country || DELIVERY_COUNTRIES[0].code}
              aria-invalid={errorState?.fieldErrors.country ? true : undefined}
              aria-describedby={errorState?.fieldErrors.country ? "country-error" : undefined}
              className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              {DELIVERY_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            {errorState?.fieldErrors.country && (
              <p id="country-error" className="mt-1 text-sm text-red-700">
                {errorState.fieldErrors.country}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className={`${buttonPrimary} mt-8 w-full sm:w-auto`}
        >
          {pending ? text.submitting : text.submit}
        </button>
        {/* Announce progress to screen readers */}
        <p className="sr-only" aria-live="polite">
          {pending ? text.submitting : ""}
        </p>
      </form>

      <section aria-labelledby="checkout-summary" className="h-fit rounded-lg bg-stone-100 p-6">
        <h2 id="checkout-summary" className="text-lg font-semibold">
          {text.summaryTitle}
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.lines.map((line) => (
            <li key={line.variantId} className="flex justify-between gap-4">
              <span>
                {line.variant.productName}
                <span className="block text-stone-600">
                  {copy.cart.size} {line.variant.size} × {line.quantity}
                </span>
              </span>
              <span className="shrink-0">{formatPrice(line.lineTotalCents, line.variant.currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-stone-300 pt-4 text-sm">
          <div className="flex justify-between">
            <dt>{copy.cart.subtotal}</dt>
            <dd>{formatPrice(cart.subtotalCents, cart.currency ?? "EUR")}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{text.shipping}</dt>
            <dd>{text.shippingDemo}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>{text.estimatedTotal}</dt>
            <dd>{formatPrice(cart.subtotalCents, cart.currency ?? "EUR")}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-stone-600">{text.totalNote}</p>
      </section>
    </div>
  );
}

function ErrorAlert({
  state,
  unavailableNames,
}: {
  state: Extract<CheckoutState, { status: "error" }>;
  unavailableNames: string[];
}) {
  return (
    <Alert kind="error" id="checkout-form-error" className="mt-4">
      <p>{state.formError}</p>
      {state.unavailableVariantIds.length > 0 && (
        <>
          {unavailableNames.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {unavailableNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
          <p className="mt-2">
            {text.errors.unavailableHint}{" "}
            <Link href="/cart" className="font-medium underline">
              {text.backToCart}
            </Link>
          </p>
        </>
      )}
    </Alert>
  );
}

function Field({
  name,
  type = "text",
  autoComplete,
  inputMode,
  hint,
  optional = false,
  className = "",
  state,
}: {
  name: Exclude<CustomerField, "country">;
  type?: string;
  autoComplete: string;
  inputMode?: "numeric";
  hint?: string;
  optional?: boolean;
  className?: string;
  state: Extract<CheckoutState, { status: "error" }> | null;
}) {
  const id = useId();
  const error = state?.fieldErrors[name];
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {text.fields[name]}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={!optional}
        // React resets the form after each submit; this puts the typed values back.
        defaultValue={state?.values[name] ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-2 focus-visible:outline-stone-900 ${
          error ? "border-red-600" : "border-stone-300"
        }`}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-stone-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function Confirmation({
  order,
}: {
  order: Extract<CheckoutState, { status: "success" }>["order"];
}) {
  return (
    <section
      aria-labelledby="confirmation-title"
      className="mt-8 max-w-2xl rounded-lg border border-green-300 bg-green-50 p-6 sm:p-8"
    >
      <h2 id="confirmation-title" className="text-2xl font-semibold text-green-900">
        {text.confirmation.title}
      </h2>
      <p className="mt-2 text-green-900">
        {text.confirmation.reference}: <strong className="font-mono">{order.reference}</strong>
      </p>
      <p className="mt-4 rounded-md bg-white px-4 py-3 text-sm text-stone-700">
        {text.confirmation.notice}
      </p>

      <ul className="mt-6 space-y-2 text-sm">
        {order.items.map((item) => (
          <li key={`${item.productName}-${item.size}`} className="flex justify-between gap-4">
            <span>
              {item.productName} — {copy.cart.size} {item.size} × {item.quantity}
            </span>
            <span>{formatPrice(item.lineTotalCents, order.currency)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1 border-t border-green-200 pt-4 text-sm">
        <div className="flex justify-between">
          <dt>{copy.cart.subtotal}</dt>
          <dd>{formatPrice(order.subtotalCents, order.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{text.shipping}</dt>
          <dd>{text.shippingDemo}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>{text.confirmation.total}</dt>
          <dd>{formatPrice(order.totalCents, order.currency)}</dd>
        </div>
      </dl>

      <Link
        href="/products"
        className={`${buttonPrimary} mt-8 inline-block`}
      >
        {text.confirmation.continueShopping}
      </Link>
    </section>
  );
}
