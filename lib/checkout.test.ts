import { describe, expect, it } from "vitest";
import { MAX_ORDER_LINES, parseCheckoutInput } from "@/lib/checkout";
import { copy } from "@/lib/copy";

const errors = copy.checkout.errors;

const validFields = {
  customerName: "Test Person",
  email: "test@example.com",
  addressLine1: "Test street 1",
  addressLine2: "",
  city: "Tallinn",
  postalCode: "10111",
  country: "EE",
};

const VARIANT_A = "3af99ac4-80ba-4b1e-9a7c-1234567890ab";
const VARIANT_B = "cbf4c76d-5a6e-4c2d-8f1e-abcdefabcdef";
const validItems = JSON.stringify([{ variantId: VARIANT_A, quantity: 2 }]);

describe("parseCheckoutInput — valid input", () => {
  it("accepts a complete form and cart", () => {
    const result = parseCheckoutInput(validFields, validItems);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.customer.city).toBe("Tallinn");
      expect(result.items).toEqual([{ variantId: VARIANT_A, quantity: 2 }]);
    }
  });

  it("trims spaces and allows a missing second address line", () => {
    const withoutLine2: Partial<typeof validFields> = { ...validFields, customerName: "  Test Person  " };
    delete withoutLine2.addressLine2;
    const result = parseCheckoutInput(withoutLine2, validItems);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.customer.customerName).toBe("Test Person");
      expect(result.customer.addressLine2).toBe("");
    }
  });
});

describe("parseCheckoutInput — customer details", () => {
  function fieldErrorsFor(fields: Record<string, string>) {
    const result = parseCheckoutInput({ ...validFields, ...fields }, validItems);
    expect(result.success).toBe(false);
    return result.success ? {} : result.fieldErrors;
  }

  it("requires the name, street and city (spaces only don't count)", () => {
    expect(fieldErrorsFor({ customerName: "   ", addressLine1: "", city: "" })).toEqual({
      customerName: errors.required,
      addressLine1: errors.required,
      city: errors.required,
    });
  });

  it.each(["not-an-email", "a@b", "@example.com", "name@ example.com"])(
    "rejects the email %s",
    (email) => {
      expect(fieldErrorsFor({ email }).email).toBe(errors.email);
    },
  );

  it.each(["1011", "101111", "abcde", "10 11"])("rejects the postal code %s", (postalCode) => {
    expect(fieldErrorsFor({ postalCode }).postalCode).toBe(errors.postalCode);
  });

  it.each(["FI", "Estonia", "ee", ""])("rejects the country %s", (country) => {
    expect(fieldErrorsFor({ country }).country).toBe(errors.country);
  });

  it("rejects values that are too long", () => {
    expect(fieldErrorsFor({ customerName: "x".repeat(201) }).customerName).toBe(errors.tooLong);
  });
});

describe("parseCheckoutInput — cart items", () => {
  function itemsInvalid(itemsJson: string) {
    const result = parseCheckoutInput(validFields, itemsJson);
    return !result.success && result.itemsInvalid;
  }

  it.each([
    ["invalid JSON", "not json"],
    ["an empty cart", "[]"],
    ["a non-array", JSON.stringify({ variantId: VARIANT_A, quantity: 1 })],
    ["a fake ID", JSON.stringify([{ variantId: "p-001-m", quantity: 1 }])],
    ["quantity 0", JSON.stringify([{ variantId: VARIANT_A, quantity: 0 }])],
    ["quantity 99", JSON.stringify([{ variantId: VARIANT_A, quantity: 99 }])],
    ["quantity 1.5", JSON.stringify([{ variantId: VARIANT_A, quantity: 1.5 }])],
    ["quantity as text", JSON.stringify([{ variantId: VARIANT_A, quantity: "2" }])],
    [
      "a duplicate size",
      JSON.stringify([
        { variantId: VARIANT_A, quantity: 1 },
        { variantId: VARIANT_A, quantity: 1 },
      ]),
    ],
  ])("rejects %s", (_label, itemsJson) => {
    expect(itemsInvalid(itemsJson)).toBe(true);
  });

  it("rejects more than the maximum number of lines", () => {
    const tooMany = Array.from({ length: MAX_ORDER_LINES + 1 }, (_, i) => ({
      variantId: `3af99ac4-80ba-4b1e-9a7c-${String(i).padStart(12, "0")}`,
      quantity: 1,
    }));
    expect(itemsInvalid(JSON.stringify(tooMany))).toBe(true);
  });

  it("accepts several different sizes", () => {
    const items = JSON.stringify([
      { variantId: VARIANT_A, quantity: 1 },
      { variantId: VARIANT_B, quantity: 3 },
    ]);
    expect(parseCheckoutInput(validFields, items).success).toBe(true);
  });

  it("ignores any price or total the browser tries to send", () => {
    const withPrice = JSON.stringify([{ variantId: VARIANT_A, quantity: 1, priceCents: 1 }]);
    const result = parseCheckoutInput(validFields, withPrice);
    expect(result.success).toBe(true);
    if (result.success) expect(result.items[0]).not.toHaveProperty("priceCents");
  });
});
