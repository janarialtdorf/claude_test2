"use client";

// Shares the cart with every component on the page (header count, product
// page, cart page) through React context, and saves it in localStorage.
//
// localStorage only exists in the browser. The server can't see it, so while
// the page is rendered on the server (and during the first moment in the
// browser) the cart has status "loading". Components show a loading state
// then, instead of a wrong "0 items".

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import {
  type AddResult,
  addItem as addItemToList,
  buildCartLines,
  calculateSubtotal,
  countItems,
  parseStoredCart,
  removeItem as removeItemFromList,
  serializeCart,
  updateQuantity as updateQuantityInList,
} from "@/lib/cart";
import type { CartCatalogue, CartItem, CartLine } from "@/types/cart";

const STORAGE_KEY = "threadline.cart.v1";

// ---- A tiny "store" around localStorage, used with useSyncExternalStore ----

const listeners = new Set<() => void>();
// Used if localStorage is blocked (e.g. some private browsing modes):
// the cart then still works, it just isn't saved after a reload.
let memoryFallback: string | null = null;

function readStoredCart(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryFallback;
  }
}

function writeStoredCart(items: CartItem[]) {
  const value = serializeCart(items);
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    memoryFallback = value;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // The "storage" event fires when the cart is changed in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// On the server there is no cart yet: `undefined` means "still loading".
const getServerSnapshot = () => undefined;

// ---- React context ----

interface CartContextValue {
  status: "loading" | "ready";
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  currency: string | null;
  unavailableCount: number;
  addItem: (variantId: string) => AddResult | "unavailable";
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  removeUnavailable: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  catalogue,
  children,
}: {
  catalogue: CartCatalogue;
  children: React.ReactNode;
}) {
  // The raw saved text. Comparing strings lets React skip re-renders
  // when nothing actually changed.
  const raw = useSyncExternalStore(subscribe, readStoredCart, getServerSnapshot);
  const status = raw === undefined ? "loading" : "ready";

  const value = useMemo<CartContextValue>(() => {
    const items = parseStoredCart(raw ?? null);
    const { lines, unavailableCount } = buildCartLines(items, catalogue);
    const { amountCents, currency } = calculateSubtotal(lines);
    // Only items that are still valid; saving these also cleans up the rest.
    const validItems = lines.map(({ variantId, quantity }) => ({ variantId, quantity }));

    return {
      status,
      lines,
      itemCount: countItems(lines),
      subtotalCents: amountCents,
      currency,
      unavailableCount,
      addItem(variantId) {
        const variant = Object.hasOwn(catalogue, variantId) ? catalogue[variantId] : undefined;
        if (!variant?.available) return "unavailable";
        const result = addItemToList(validItems, variantId);
        if (result.result === "added") writeStoredCart(result.items);
        return result.result;
      },
      updateQuantity(variantId, quantity) {
        writeStoredCart(updateQuantityInList(validItems, variantId, quantity));
      },
      removeItem(variantId) {
        writeStoredCart(removeItemFromList(validItems, variantId));
      },
      removeUnavailable() {
        writeStoredCart(validItems);
      },
    };
  }, [raw, status, catalogue]);

  return <CartContext value={value}>{children}</CartContext>;
}

// Components call useCart() to read or change the cart.
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
