import { describe, expect, it } from "vitest";
import {
  MAX_QUANTITY_PER_ITEM,
  addItem,
  buildCartLines,
  calculateSubtotal,
  countItems,
  parseStoredCart,
  removeItem,
  serializeCart,
  updateQuantity,
} from "@/lib/cart";
import type { CartCatalogue, CartVariantInfo } from "@/types/cart";

// A tiny fake catalogue, so the tests don't depend on the real demo data.
function variant(overrides: Partial<CartVariantInfo> & { variantId: string }): CartVariantInfo {
  return {
    productSlug: "test-product",
    productName: "Test Product",
    size: "M",
    priceCents: 1000,
    currency: "EUR",
    available: true,
    placeholderColor: "#ccc",
    imageUrl: null,
    ...overrides,
  };
}

const catalogue: CartCatalogue = {
  "tee-m": variant({ variantId: "tee-m", priceCents: 1999 }),
  "jeans-l": variant({ variantId: "jeans-l", priceCents: 5999, size: "L" }),
  "skirt-s": variant({ variantId: "skirt-s", available: false }),
};

describe("addItem", () => {
  it("adds a new item with quantity 1", () => {
    const { items, result } = addItem([], "tee-m");
    expect(items).toEqual([{ variantId: "tee-m", quantity: 1 }]);
    expect(result).toBe("added");
  });

  it("increases the quantity when the same variant is added again", () => {
    const first = addItem([], "tee-m").items;
    const { items } = addItem(first, "tee-m");
    expect(items).toEqual([{ variantId: "tee-m", quantity: 2 }]);
  });

  it("does not go above the maximum quantity", () => {
    const full = [{ variantId: "tee-m", quantity: MAX_QUANTITY_PER_ITEM }];
    const { items, result } = addItem(full, "tee-m");
    expect(items[0].quantity).toBe(MAX_QUANTITY_PER_ITEM);
    expect(result).toBe("limit_reached");
  });

  it("does not modify the original array", () => {
    const original = [{ variantId: "tee-m", quantity: 1 }];
    addItem(original, "tee-m");
    expect(original).toEqual([{ variantId: "tee-m", quantity: 1 }]);
  });
});

describe("updateQuantity", () => {
  const items = [{ variantId: "tee-m", quantity: 2 }];

  it("sets the new quantity", () => {
    expect(updateQuantity(items, "tee-m", 5)[0].quantity).toBe(5);
  });

  it.each([
    [0, 1],
    [-3, 1],
    [999, MAX_QUANTITY_PER_ITEM],
    [2.7, 2],
    [Number.NaN, 1],
  ])("clamps %s to %s", (input, expected) => {
    expect(updateQuantity(items, "tee-m", input)[0].quantity).toBe(expected);
  });
});

describe("removeItem", () => {
  it("removes only the matching variant", () => {
    const items = [
      { variantId: "tee-m", quantity: 1 },
      { variantId: "jeans-l", quantity: 1 },
    ];
    expect(removeItem(items, "tee-m")).toEqual([{ variantId: "jeans-l", quantity: 1 }]);
  });
});

describe("parseStoredCart", () => {
  it("reads a valid saved cart", () => {
    const saved = serializeCart([{ variantId: "tee-m", quantity: 3 }]);
    expect(parseStoredCart(saved)).toEqual([{ variantId: "tee-m", quantity: 3 }]);
  });

  it.each([null, "", "not json{", "42", '{"variantId":"tee-m"}', "null"])(
    "returns an empty cart for invalid data: %s",
    (raw) => {
      expect(parseStoredCart(raw)).toEqual([]);
    },
  );

  it("drops malformed entries and clamps quantities", () => {
    const raw = JSON.stringify([
      { variantId: "tee-m", quantity: 999 },
      { variantId: 123, quantity: 1 },
      { variantId: "jeans-l", quantity: "2" },
      null,
      { variantId: "", quantity: 1 },
    ]);
    expect(parseStoredCart(raw)).toEqual([
      { variantId: "tee-m", quantity: MAX_QUANTITY_PER_ITEM },
    ]);
  });

  it("merges duplicate entries", () => {
    const raw = JSON.stringify([
      { variantId: "tee-m", quantity: 2 },
      { variantId: "tee-m", quantity: 3 },
    ]);
    expect(parseStoredCart(raw)).toEqual([{ variantId: "tee-m", quantity: 5 }]);
  });
});

describe("buildCartLines", () => {
  it("joins items with catalogue info and calculates line totals", () => {
    const { lines, unavailableCount } = buildCartLines(
      [{ variantId: "tee-m", quantity: 2 }],
      catalogue,
    );
    expect(unavailableCount).toBe(0);
    expect(lines[0].lineTotalCents).toBe(3998);
    expect(lines[0].variant.productName).toBe("Test Product");
  });

  it("leaves out unknown and sold-out variants", () => {
    const { lines, unavailableCount } = buildCartLines(
      [
        { variantId: "tee-m", quantity: 1 },
        { variantId: "does-not-exist", quantity: 1 },
        { variantId: "skirt-s", quantity: 1 },
        { variantId: "toString", quantity: 1 },
      ],
      catalogue,
    );
    expect(lines.map((line) => line.variantId)).toEqual(["tee-m"]);
    expect(unavailableCount).toBe(3);
  });
});

describe("calculateSubtotal and countItems", () => {
  it("adds line totals exactly in cents", () => {
    // 2 × €19.99 + 1 × €59.99 = €99.97. We add whole cents (1999 + 1999 + 5999)
    // because decimal floats can be inexact: in JavaScript, 0.1 + 0.2 is 0.30000000000000004.
    const { lines } = buildCartLines(
      [
        { variantId: "tee-m", quantity: 2 },
        { variantId: "jeans-l", quantity: 1 },
      ],
      catalogue,
    );
    expect(calculateSubtotal(lines)).toEqual({ amountCents: 9997, currency: "EUR" });
    expect(countItems(lines)).toBe(3);
  });

  it("returns zero for an empty cart", () => {
    expect(calculateSubtotal([])).toEqual({ amountCents: 0, currency: null });
    expect(countItems([])).toBe(0);
  });

  it("refuses to add up different currencies", () => {
    const mixed: CartCatalogue = {
      a: variant({ variantId: "a", currency: "EUR" }),
      b: variant({ variantId: "b", currency: "USD" }),
    };
    const { lines } = buildCartLines(
      [
        { variantId: "a", quantity: 1 },
        { variantId: "b", quantity: 1 },
      ],
      mixed,
    );
    expect(() => calculateSubtotal(lines)).toThrow("more than one currency");
  });
});
