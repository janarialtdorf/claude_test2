import { describe, expect, it } from "vitest";
import { productFieldErrors, productInputSchema, toDatabaseProduct } from "@/lib/admin-product-schema";
import { copy } from "@/lib/copy";
import { centsToEuroInput, parseEuroToCents } from "@/lib/money";
import { slugify } from "@/lib/slug";

const errors = copy.admin.form.errors;

describe("slugify", () => {
  it.each([
    ["Linen Shirt", "linen-shirt"],
    ["  Wool-Blend   Overcoat!! ", "wool-blend-overcoat"],
    ["Õhuline särk – Ä Ö Ü", "ohuline-sark-a-o-u"],
    ["T-Shirt (2026)", "t-shirt-2026"],
    ["!!!", "product"],
    ["", "product"],
  ])("%s → %s", (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });

  it("keeps slugs to at most 80 characters, without a trailing dash", () => {
    const slug = slugify("word ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("parseEuroToCents", () => {
  it.each([
    ["39.99", 3999],
    ["39,99", 3999],
    ["39.9", 3990],
    ["39", 3900],
    [" 0.05 ", 5],
    ["19.99", 1999], // 19.99 * 100 would be 1998.9999999999998
    ["0", 0],
  ])("%s → %s cents", (text, cents) => {
    expect(parseEuroToCents(text)).toBe(cents);
  });

  it.each(["", "abc", "-5", "39.999", "1e3", "39.", ".99", "12345678", "3 9"])(
    "rejects %s",
    (text) => {
      expect(parseEuroToCents(text)).toBeNull();
    },
  );
});

describe("centsToEuroInput", () => {
  it.each([
    [3999, "39.99"],
    [3900, "39.00"],
    [5, "0.05"],
    [0, "0.00"],
  ])("%s → %s", (cents, text) => {
    expect(centsToEuroInput(cents)).toBe(text);
  });
});

describe("productInputSchema", () => {
  const valid = {
    name: "Test Tee",
    description: "A test product.",
    priceCents: 2500,
    categoryId: "3af99ac4-80ba-4b1e-9a7c-1234567890ab",
    colorName: "Red",
    placeholderColor: "#aa0000",
    featured: false,
    isPublished: true,
    sizes: [
      { size: "S", stockQuantity: 3 },
      { size: "M", stockQuantity: 0 },
    ],
  };

  function errorsFor(changes: Record<string, unknown>) {
    const result = productInputSchema.safeParse({ ...valid, ...changes });
    expect(result.success).toBe(false);
    return result.success ? {} : productFieldErrors(result.error);
  }

  it("accepts a valid product and converts it for the database", () => {
    const result = productInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(toDatabaseProduct(result.data)).toMatchObject({
        price_cents: 2500,
        is_published: true,
        sizes: [
          { size: "S", stock_quantity: 3 },
          { size: "M", stock_quantity: 0 },
        ],
      });
    }
  });

  it("requires a name", () => {
    expect(errorsFor({ name: "   " }).name).toBe(errors.required);
  });

  it.each([-1, 19.99, 1_000_001, "2500", null])("rejects the price %s", (priceCents) => {
    expect(errorsFor({ priceCents }).priceCents).toBe(errors.price);
  });

  it.each(["not-a-uuid", ""])("rejects the category %s", (categoryId) => {
    expect(errorsFor({ categoryId }).categoryId).toBe(errors.category);
  });

  it.each(["red", "#fff", "#gggggg", ""])("rejects the colour %s", (placeholderColor) => {
    expect(errorsFor({ placeholderColor }).placeholderColor).toBe(errors.color);
  });

  it("requires at least one size", () => {
    expect(errorsFor({ sizes: [] }).sizes).toBe(errors.sizes);
  });

  it("rejects the same size twice", () => {
    const sizes = [
      { size: "S", stockQuantity: 1 },
      { size: "S", stockQuantity: 2 },
    ];
    expect(errorsFor({ sizes }).sizes).toBe(errors.sizes);
  });

  it("rejects unknown sizes and invalid stock", () => {
    expect(productInputSchema.safeParse({ ...valid, sizes: [{ size: "XXL", stockQuantity: 1 }] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...valid, sizes: [{ size: "M", stockQuantity: -1 }] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...valid, sizes: [{ size: "M", stockQuantity: 1.5 }] }).success).toBe(false);
  });

  it("ignores fields it doesn't know (e.g. an attempt to set the slug or is_demo)", () => {
    const result = productInputSchema.safeParse({ ...valid, slug: "hack", is_demo: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).not.toHaveProperty("slug");
  });
});
