// Turns a product name into a URL-friendly "slug":
//   "Linen Shirt – Õhuline!"  →  "linen-shirt-ohuline"
// The database adds "-2", "-3"… if the slug is already taken.
export function slugify(name: string): string {
  const slug = name
    .normalize("NFD") // split letters from accents: "õ" → "o" + "~"
    .replace(/[̀-ͯ]/g, "") // drop the accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // anything else becomes a dash
    .replace(/^-+|-+$/g, "") // no dashes at the start or end
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "product";
}
