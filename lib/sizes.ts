// The clothing sizes the shop sells, in display order — the single source
// for the size list (the database CHECK constraint allows the same values).

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;

export type Size = (typeof SIZES)[number];

export function isSize(value: string): value is Size {
  return (SIZES as readonly string[]).includes(value);
}

// Keeps only known sizes and sorts them XS → XL.
// Works on any rows with a `size` field (variants, stock rows, …).
export function sortBySize<T extends { size: string }>(rows: T[]): (T & { size: Size })[] {
  return rows
    .filter((row): row is T & { size: Size } => isSize(row.size))
    .sort((a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size));
}
