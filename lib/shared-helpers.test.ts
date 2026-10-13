// Tests for the small shared helpers introduced by the refactor.

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { adminErrorMessage } from "@/lib/admin-errors";
import { copy } from "@/lib/copy";
import { sortImages } from "@/lib/images";
import { SIZES, isSize, sortBySize } from "@/lib/sizes";
import { firstFieldErrors, isUuid } from "@/lib/validation";

describe("sizes", () => {
  it("lists sizes in display order", () => {
    expect(SIZES).toEqual(["XS", "S", "M", "L", "XL"]);
  });

  it("recognises only known sizes", () => {
    expect(isSize("M")).toBe(true);
    expect(isSize("XXL")).toBe(false);
    expect(isSize("m")).toBe(false);
  });

  it("sorts rows XS → XL, drops unknown sizes and keeps other fields", () => {
    const rows = [
      { size: "XL", stock: 1 },
      { size: "XXL", stock: 9 },
      { size: "S", stock: 2 },
      { size: "M", stock: 3 },
    ];
    expect(sortBySize(rows)).toEqual([
      { size: "S", stock: 2 },
      { size: "M", stock: 3 },
      { size: "XL", stock: 1 },
    ]);
  });

  it("does not change the original array", () => {
    const rows = [{ size: "L" }, { size: "XS" }];
    sortBySize(rows);
    expect(rows).toEqual([{ size: "L" }, { size: "XS" }]);
  });
});

describe("sortImages", () => {
  it("orders by sort_order, then by upload time, without changing the input", () => {
    const rows = [
      { id: "c", sort_order: 1, created_at: "2026-10-13T10:00:00Z" },
      { id: "b", sort_order: 0, created_at: "2026-10-13T12:00:00Z" },
      { id: "a", sort_order: 0, created_at: "2026-10-13T11:00:00Z" },
      { id: "main", sort_order: -1, created_at: "2026-10-13T13:00:00Z" },
    ];
    expect(sortImages(rows).map((r) => r.id)).toEqual(["main", "a", "b", "c"]);
    expect(rows[0].id).toBe("c");
  });
});

describe("isUuid", () => {
  it.each(["3af99ac4-80ba-4b1e-9a7c-1234567890ab", "33333333-3333-4333-8333-333333333333"])(
    "accepts %s",
    (value) => {
      expect(isUuid(value)).toBe(true);
    },
  );

  it.each(["", "p-001-m", "not-a-uuid", "3af99ac4-80ba-4b1e-9a7c-1234567890a", "../etc/passwd"])(
    "rejects %j",
    (value) => {
      expect(isUuid(value)).toBe(false);
    },
  );
});

describe("firstFieldErrors", () => {
  it("keeps only the first message per field", () => {
    const schema = z.object({
      name: z.string().min(1, "Name required").min(3, "Name too short"),
      age: z.number("Age must be a number"),
    });
    const result = schema.safeParse({ name: "", age: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error)).toEqual({ name: "Name required", age: "Age must be a number" });
    }
  });
});

describe("adminErrorMessage", () => {
  const errors = copy.admin.form.errors;

  it.each([
    [401, errors.sessionExpired],
    [403, errors.forbidden],
    [404, errors.notFound],
  ])("maps %s to its message", (status, message) => {
    expect(adminErrorMessage(status, { error: "ignored" })).toBe(message);
  });

  it("uses the server's message for other client errors (400, 409, 413)", () => {
    expect(adminErrorMessage(409, { error: "Already 8 images." })).toBe("Already 8 images.");
  });

  it("falls back to the generic message for server errors and missing messages", () => {
    expect(adminErrorMessage(500, { error: "Internal details" })).toBe(errors.generic);
    expect(adminErrorMessage(400)).toBe(errors.generic);
    expect(adminErrorMessage(400, { error: 42 })).toBe(errors.generic);
  });
});
