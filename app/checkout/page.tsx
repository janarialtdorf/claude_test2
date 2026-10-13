import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: copy.checkout.title,
};

export default function CheckoutPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{copy.checkout.title}</h1>
      {/* Always visible, so nobody mistakes this for a real purchase */}
      <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {copy.checkout.demoBanner}
      </p>
      <CheckoutForm />
    </div>
  );
}
