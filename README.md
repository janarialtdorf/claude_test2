# Threadline — demo clothing webshop

A learning project: a responsive clothing storefront built with Next.js.

> **Demo only.** All products are sample data. Checkout creates clearly
> labelled **demo orders**: no payment is taken and nothing is shipped.

## Tech stack

- [Next.js 16](https://nextjs.org) with the App Router (Cache Components enabled)
- React 19 and TypeScript (strict mode)
- Tailwind CSS 4
- Supabase (PostgreSQL) for the product catalogue, via `@supabase/supabase-js`
- Zod for validating form input on the server
- Vitest for unit tests
- npm (use npm only, not yarn/pnpm/bun)

## Getting started

Requirements: Node.js 20 or newer (developed on Node 22) and a Supabase project.

Run these commands in the project folder (the one containing `package.json`):

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill in the values from the Supabase
dashboard → Project Settings → API Keys:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` —
  public by design, used to read the catalogue.
- `SUPABASE_SECRET_KEY` — **secret**, used only on the server to place orders.
  Never commit it, share it, or give it a `NEXT_PUBLIC_` prefix.
- `RATE_LIMIT_SECRET` — **secret**, any long random value (the command is in
  `.env.example`). Used to hash visitor IPs for rate limiting.

`.env.local` is ignored by Git.

Set up the database (see below), then start the site:

```bash
npm run dev
```

Then open <http://localhost:3000>.

## Database setup (Supabase)

The schema lives in `supabase/migrations/` and the demo data in
`supabase/seed.sql`. They are applied with the Supabase CLI (installed as a
dev dependency, so use `npx supabase`). Run these in the project folder:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push --dry-run --include-seed
npx supabase db push --include-seed
```

`login` opens your browser. `--dry-run` shows what would change without
changing anything. After changing the schema, create a **new** migration with
`npx supabase migration new <name>` (never edit one that has already been
applied), push it, and regenerate the TypeScript types with `npm run db:types`.

**Security:** every table has Row Level Security. With the publishable key,
the public can only read published products, categories and sizes (sizes show
in stock yes/no, never exact stock). Orders can't be read or written by the
public at all.

**Orders** are created by the database function `place_demo_order`, which
only the server (secret key) may call. In one transaction it checks the items
and stock, takes prices from the `products` table, saves the order with
price/name snapshots, and reduces stock. If anything fails, nothing is saved.

## Rate limiting

Checkout attempts are limited (settings in `lib/rate-limit.ts`):

- **Per visitor: 5 order attempts per 10 minutes**
- **Whole shop: 50 order attempts per 10 minutes** (all visitors together)

Only attempts that pass form validation count, so fixing typos is free.
Counters live in the `rate_limit_counters` table and are updated atomically by
the database function `consume_rate_limit` ("fixed window" counting). Both are
accessible only to the server.

**Privacy:** visitors are identified by an HMAC hash of their IP address
(using `RATE_LIMIT_SECRET`); raw IPs are never stored, and counters older than
a day are deleted automatically.

**Before deploying:** the visitor's IP is read from the `x-forwarded-for`
header. Locally, anyone can fake that header to look like a new visitor —
the shop-wide limit is the backstop for that. On a hosting platform, confirm
that the platform sets this header itself (and strips client-sent values)
before relying on the per-visitor limit. A CAPTCHA (e.g. Cloudflare
Turnstile) would add protection against bots; it's not included yet.

`npm run build` loads the catalogue from Supabase, so it needs internet access
and the variables in `.env.local`.

## Useful scripts

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start the development server with hot reload  |
| `npm run build`    | Create a production build (also type-checks)  |
| `npm run start`    | Run the production build locally              |
| `npm run lint`     | Check the code with ESLint                    |
| `npm test`         | Run the unit tests once (Vitest)              |
| `npm run test:watch` | Re-run tests automatically as you edit      |
| `npm run db:types` | Regenerate `types/database.ts` from Supabase  |
| `npx tsc --noEmit` | Type-check without building                   |

## Project structure

```
app/                      Routes (each folder = a URL)
  layout.tsx              Shared layout: header, demo notice, footer
  page.tsx                Home page  →  /
  products/page.tsx       Product listing  →  /products?category=tops
  products/[slug]/        Product detail  →  /products/classic-cotton-t-shirt
  cart/page.tsx           Cart page  →  /cart
  checkout/page.tsx       Checkout page  →  /checkout
  checkout/actions.ts     Server Action that places the demo order
  not-found.tsx           404 page for unknown URLs
  error.tsx               Friendly error page if something crashes
  global-error.tsx        Error page if the whole layout fails (e.g. database down)
components/               Reusable UI (header, product card, mobile menu…)
  CartProvider.tsx        Shares the cart with all pages, saves it in localStorage
  AddToCart.tsx           Size picker + "Add to cart" on product pages
  CartView.tsx            Cart page contents (quantities, remove, subtotal)
  CheckoutForm.tsx        Delivery form, order summary and confirmation
lib/products.ts           Reads the catalogue from Supabase (cached), the only data access point
lib/supabase/server.ts    Server-only Supabase client (publishable key, read-only)
lib/supabase/admin.ts     Server-only Supabase client (secret key, places orders)
lib/checkout.ts           Checkout validation rules (Zod)
lib/checkout.test.ts      Unit tests for the checkout validation
lib/rate-limit.ts         Rate-limit settings, IP + hashing helpers
lib/rate-limit.test.ts    Unit tests for the rate-limit helpers
lib/cart.ts               Cart logic as pure functions (add, update, subtotal…)
lib/cart.test.ts          Unit tests for the cart logic
lib/copy.ts               All visible text (brand name, labels) in one place
lib/format.ts             Price formatting (cents → "€39.99")
types/product.ts          TypeScript types for products, sizes, categories
types/cart.ts             TypeScript types for the cart
types/database.ts         Generated from the database (npm run db:types), don't edit
supabase/migrations/      SQL that creates tables, permissions and security rules
supabase/seed.sql         DEMO products, categories and sizes
```

## Key decisions

- **Prices are integers in cents** (`3999` = €39.99) to avoid floating-point
  rounding errors. Each product stores its currency code explicitly.
- **The Supabase database is the single source of truth** for products,
  prices and stock. Pages only read it through `lib/products.ts`, which
  caches the result for about a minute (`"use cache"` + `cacheLife("minutes")`).
- **Database rules protect the data, not the key.** The publishable key is
  public by design; Row Level Security and column grants decide what it can do.
- **Placeholder images**: there are no licensed product photos yet, so each
  product shows a coloured block labelled "Demo product".
- **Server Components by default.** Only interactive parts (mobile menu, cart)
  are client components.
- **The cart stores only `{ variantId, quantity }` in localStorage — never
  prices.** Prices are looked up in the catalogue every time, and saved data
  is validated on load (bad entries dropped, quantities limited to 1–10).
  A browser cart is not trusted: a future checkout must recheck everything
  on the server — which checkout does.
- **The database decides the order total.** The browser sends only size IDs
  and quantities; `place_demo_order` calculates prices and totals itself.
  The cart's subtotal is only a preview.

## What's done / what's next

Done (milestone 1):

- Home page, product listing with category filter (shareable via URL),
  product detail pages with size availability, not-found and error pages,
  responsive layout with mobile menu.

Done (milestone 2):

- Size selection (sold-out sizes disabled), add to cart, cart page with
  quantity changes, remove and subtotal, cart count in the header,
  cart saved in the browser, unit tests for the cart logic.

Done (database):

- Supabase schema for categories, products, sizes, orders and order items,
  with Row Level Security; storefront reads the catalogue from the database.

Done (checkout):

- Demo checkout with validated delivery details (Estonia only), server-side
  order creation in one transaction (prices, totals and stock checked in the
  database), stock reduced on order, demo confirmation, cart cleared.

Done (rate limiting):

- Per-visitor and shop-wide limits on checkout attempts, stored in the
  database with hashed visitor IDs.

Not built yet / known gaps:

- Real payments, order emails, accounts, order history
- CAPTCHA / bot protection (planned option: Cloudflare Turnstile)
- Double submits are blocked in the browser; a server-side idempotency key
  would also protect against network retries
- Sorting, real product images, informational pages (About, Shipping…)
