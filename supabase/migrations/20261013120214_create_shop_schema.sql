-- =====================================================================
-- Threadline shop schema
--
-- Catalogue: categories → products → product_variants (one row per size)
-- Orders:    orders → order_items (with snapshots of name/size/price)
--
-- Security model (Row Level Security):
--   * The public (anon / publishable key) may only READ the catalogue,
--     and only published products. Exact stock numbers stay hidden.
--   * Orders are not accessible to the public at all. Later, the server
--     will write them using the secret key (service_role).
-- =====================================================================


-- ---------- Catalogue ------------------------------------------------

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 1 and 100),
  description text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 1 and 200),
  description       text not null default '',
  -- Money as whole cents (3999 = 39.99) to avoid rounding errors.
  price_cents       integer not null check (price_cents >= 0),
  currency          char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  -- "restrict": a category can't be deleted while products still use it.
  category_id       uuid not null references public.categories (id) on delete restrict,
  color_name        text not null default '',
  placeholder_color text not null default '#e7e5e4' check (placeholder_color ~ '^#[0-9a-fA-F]{6}$'),
  featured          boolean not null default false,
  -- New products are hidden until explicitly published.
  is_published      boolean not null default false,
  is_demo           boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);

create table public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  -- "cascade": deleting a product also deletes its sizes.
  product_id     uuid not null references public.products (id) on delete cascade,
  size           text not null check (size in ('XS', 'S', 'M', 'L', 'XL')),
  sku            text not null unique,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  -- Calculated automatically by the database from stock_quantity.
  -- The public sees only this true/false value, never the exact number.
  in_stock       boolean generated always as (stock_quantity > 0) stored,
  created_at     timestamptz not null default now(),
  -- Each product can have each size only once.
  unique (product_id, size)
);


-- ---------- Orders ---------------------------------------------------

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  status         text not null default 'demo_placed' check (status in ('demo_placed', 'cancelled')),
  -- Only demo orders are allowed until real commerce is set up and reviewed.
  is_demo        boolean not null default true check (is_demo),
  customer_name  text not null check (char_length(customer_name) between 1 and 200),
  email          text not null check (char_length(email) between 3 and 320),
  address_line1  text not null check (char_length(address_line1) between 1 and 200),
  address_line2  text not null default '' check (char_length(address_line2) <= 200),
  city           text not null check (char_length(city) between 1 and 100),
  postal_code    text not null check (char_length(postal_code) between 1 and 20),
  country        char(2) not null check (country ~ '^[A-Z]{2}$'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  -- The database itself refuses totals that don't add up.
  total_cents    integer not null check (total_cents = subtotal_cents + shipping_cents),
  currency       char(3) not null check (currency ~ '^[A-Z]{3}$'),
  created_at     timestamptz not null default now()
);

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  -- "set null": if a variant is ever deleted, old orders keep their snapshot.
  variant_id       uuid references public.product_variants (id) on delete set null,
  -- Snapshots: copied at order time so later product edits don't change history.
  product_name     text not null,
  size             text not null,
  sku              text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity         integer not null check (quantity between 1 and 10),
  line_total_cents integer not null check (line_total_cents = unit_price_cents * quantity),
  created_at       timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);


-- ---------- Keep products.updated_at current -------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();


-- ---------- Permissions ----------------------------------------------
-- Start from "no access", then grant only what's needed.

revoke all on table
  public.categories, public.products, public.product_variants,
  public.orders, public.order_items
from anon, authenticated;

grant all on table
  public.categories, public.products, public.product_variants,
  public.orders, public.order_items
to service_role;

grant select on table public.categories, public.products to anon, authenticated;
-- Column-level grant: stock_quantity is deliberately left out.
grant select (id, product_id, size, sku, in_stock) on table public.product_variants to anon, authenticated;


-- ---------- Row Level Security ---------------------------------------
-- With RLS enabled, rows are invisible unless a policy allows them.
-- orders and order_items get NO policies, so the public can't touch them.

alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

create policy "Anyone can read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Anyone can read published products"
  on public.products for select
  to anon, authenticated
  using (is_published);

create policy "Anyone can read sizes of published products"
  on public.product_variants for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.is_published
    )
  );
