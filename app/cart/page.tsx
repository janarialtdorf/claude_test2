import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: copy.cart.title,
};

// The heading renders on the server; the cart contents live in the browser
// (localStorage), so they're shown by the client component <CartView>.
export default function CartPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{copy.cart.title}</h1>
      <CartView />
    </div>
  );
}
