# Threadline — demo clothing webshop

A learning project: a responsive clothing storefront built with Next.js.

> **Demo only.** All products are sample data. The cart lives in your
> browser and is not an order. There is no checkout, payment or real ordering yet.

## Tech stack

- [Next.js 16](https://nextjs.org) with the App Router (Cache Components enabled)
- React 19 and TypeScript (strict mode)
- Tailwind CSS 4
- Vitest for unit tests
- npm (use npm only, not yarn/pnpm/bun)

## Getting started

Requirements: Node.js 20 or newer (developed on Node 22).

Run these commands in the project folder (the one containing `package.json`):

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Useful scripts

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start the development server with hot reload  |
| `npm run build`    | Create a production build (also type-checks)  |
| `npm run start`    | Run the production build locally              |
| `npm run lint`     | Check the code with ESLint                    |
| `npm test`         | Run the unit tests once (Vitest)              |
| `npm run test:watch` | Re-run tests automatically as you edit      |
| `npx tsc --noEmit` | Type-check without building                   |

## Project structure

```
app/                      Routes (each folder = a URL)
  layout.tsx              Shared layout: header, demo notice, footer
  page.tsx                Home page  →  /
  products/page.tsx       Product listing  →  /products?category=tops
  products/[slug]/        Product detail  →  /products/classic-cotton-t-shirt
  cart/page.tsx           Cart page  →  /cart
  not-found.tsx           404 page for unknown URLs
  error.tsx               Friendly error page if something crashes
components/               Reusable UI (header, product card, mobile menu…)
  CartProvider.tsx        Shares the cart with all pages, saves it in localStorage
  AddToCart.tsx           Size picker + "Add to cart" on product pages
  CartView.tsx            Cart page contents (quantities, remove, subtotal)
lib/products.ts           DEMO catalogue data + functions to read it
lib/cart.ts               Cart logic as pure functions (add, update, subtotal…)
lib/cart.test.ts          Unit tests for the cart logic
lib/copy.ts               All visible text (brand name, labels) in one place
lib/format.ts             Price formatting (cents → "€39.99")
types/product.ts          TypeScript types for products, sizes, categories
types/cart.ts             TypeScript types for the cart
```

## Key decisions

- **Prices are integers in cents** (`3999` = €39.99) to avoid floating-point
  rounding errors. Each product stores its currency code explicitly.
- **`lib/products.ts` is the single source of truth** for product data. Pages
  only use its functions, so it can later be replaced by a database.
- **Placeholder images**: there are no licensed product photos yet, so each
  product shows a coloured block labelled "Demo product".
- **Server Components by default.** Only interactive parts (mobile menu, cart)
  are client components.
- **The cart stores only `{ variantId, quantity }` in localStorage — never
  prices.** Prices are looked up in the catalogue every time, and saved data
  is validated on load (bad entries dropped, quantities limited to 1–10).
  A browser cart is not trusted: a future checkout must recheck everything
  on the server.

## What's done / what's next

Done (milestone 1):

- Home page, product listing with category filter (shareable via URL),
  product detail pages with size availability, not-found and error pages,
  responsive layout with mobile menu.

Done (milestone 2):

- Size selection (sold-out sizes disabled), add to cart, cart page with
  quantity changes, remove and subtotal, cart count in the header,
  cart saved in the browser, unit tests for the cart logic.

Not built yet:

- Checkout, order creation (server-side price and stock checks)
- Database (planned: PostgreSQL + Prisma, after agreeing on a schema)
- Sorting, real product images, informational pages (About, Shipping…)
