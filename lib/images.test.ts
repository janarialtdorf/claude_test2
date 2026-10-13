import { describe, expect, it } from "vitest";
import { altTextSchema, detectImageType, imageUpdateSchema, productImageUrl } from "@/lib/images";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

describe("detectImageType", () => {
  it("recognises a JPEG", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10))).toEqual({ mime: "image/jpeg", extension: "jpg" });
  });

  it("recognises a PNG", () => {
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0))).toEqual({
      mime: "image/png",
      extension: "png",
    });
  });

  it("recognises a WebP", () => {
    const webp = new Uint8Array([...text("RIFF"), 0x24, 0, 0, 0, ...text("WEBPVP8 ")]);
    expect(detectImageType(webp)).toEqual({ mime: "image/webp", extension: "webp" });
  });

  it.each([
    ["a text file renamed to .jpg", text("hello, I am not an image")],
    ["an empty file", bytes()],
    ["a GIF", text("GIF89a......")],
    ["an SVG (can contain scripts)", text("<svg xmlns='http://www.w3.org/2000/svg'>")],
    ["a RIFF file that isn't WebP (e.g. WAV)", new Uint8Array([...text("RIFF"), 0, 0, 0, 0, ...text("WAVE")])],
    ["a truncated JPEG header", bytes(0xff, 0xd8)],
    ["a PDF", text("%PDF-1.7")],
  ])("rejects %s", (_label, data) => {
    expect(detectImageType(data)).toBeNull();
  });
});

describe("productImageUrl", () => {
  it("builds the public Storage URL and encodes unsafe characters", () => {
    const url = productImageUrl("abc/my image.jpg");
    expect(url).toMatch(/\/storage\/v1\/object\/public\/product-images\/abc\/my%20image\.jpg$/);
  });
});

describe("altTextSchema", () => {
  it("trims and accepts normal alt text", () => {
    expect(altTextSchema.parse("  Red T-shirt, front view ")).toBe("Red T-shirt, front view");
  });

  it.each(["", "   ", "x".repeat(301)])("rejects %j", (value) => {
    expect(altTextSchema.safeParse(value).success).toBe(false);
  });
});

describe("imageUpdateSchema", () => {
  it.each([{ altText: "New alt" }, { makeMain: true }, { altText: "New alt", makeMain: true }])(
    "accepts %j",
    (body) => {
      expect(imageUpdateSchema.safeParse(body).success).toBe(true);
    },
  );

  it.each([{}, { makeMain: false }, { altText: "" }, { sortOrder: -100 }])("rejects %j", (body) => {
    expect(imageUpdateSchema.safeParse(body).success).toBe(false);
  });
});
