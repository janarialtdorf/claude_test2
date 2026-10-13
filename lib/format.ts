// Formats an integer amount of cents for display, e.g. 3999 → "€39.99".
// The browser's built-in Intl API handles currency symbols and separators.
export function formatPrice(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}
