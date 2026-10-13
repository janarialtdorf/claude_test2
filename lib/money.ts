// Converting between what admins type ("39.99" or "39,99") and what we store
// (whole cents: 3999). We work on the TEXT, digit by digit, instead of
// multiplying a decimal number by 100 — 19.99 * 100 is 1998.9999999999998
// in JavaScript.

// Returns cents, or null if the text isn't a valid euro amount.
export function parseEuroToCents(text: string): number | null {
  const match = text.trim().match(/^(\d{1,7})(?:[.,](\d{1,2}))?$/);
  if (!match) return null;
  const euros = Number(match[1]);
  const cents = Number((match[2] ?? "0").padEnd(2, "0"));
  return euros * 100 + cents;
}

// 3999 → "39.99" (for filling in the edit form).
export function centsToEuroInput(cents: number): string {
  const euros = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");
  return `${euros}.${rest}`;
}
