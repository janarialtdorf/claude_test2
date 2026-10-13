-- =====================================================================
-- Admin product management (create / edit / delete).
--
-- Two layers protect writes:
--   1. Row Level Security policies: only admins (is_admin()) may insert,
--      update or delete products and sizes — whatever code is calling.
--   2. The functions below check is_admin() themselves, too.
--
-- Create and edit go through functions so a product and its sizes are
-- saved together in ONE transaction (all or nothing).
-- =====================================================================


-- ---------- Permissions for logged-in users (RLS narrows to admins) ---

grant insert, update, delete on table public.products, public.product_variants to authenticated;
-- Admins need to see exact stock. Column grants are per database role, so
-- this applies to every logged-in account — the policies below still limit
-- which ROWS non-admins see (only published products, as for the public).
grant select (stock_quantity, created_at) on table public.product_variants to authenticated;


-- ---------- Policies: admins can see and change everything ------------
-- These are added to the existing public "read published" policies;
-- PostgreSQL allows a row if ANY policy allows it.

create policy "Admins can read all products"
  on public.products for select to authenticated
  using ((select public.is_admin()));

create policy "Admins can create products"
  on public.products for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update products"
  on public.products for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete products"
  on public.products for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins can read all sizes"
  on public.product_variants for select to authenticated
  using ((select public.is_admin()));

create policy "Admins can create sizes"
  on public.product_variants for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update sizes"
  on public.product_variants for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete sizes"
  on public.product_variants for delete to authenticated
  using ((select public.is_admin()));


-- ---------- Create a product with its sizes ---------------------------
-- p_product: {"name", "description", "price_cents", "category_id",
--             "color_name", "placeholder_color", "featured", "is_published",
--             "sizes": [{"size": "M", "stock_quantity": 10}, ...]}
-- p_base_slug: URL name made from the product name (e.g. "linen-shirt");
--              "-2", "-3"… is added if it's already taken.
create function public.admin_create_product(p_product jsonb, p_base_slug text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_slug   text := p_base_slug;
  v_suffix integer := 2;
  v_id     uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if jsonb_typeof(p_product -> 'sizes') <> 'array'
     or jsonb_array_length(p_product -> 'sizes') not between 1 and 5 then
    raise exception 'invalid_input';
  end if;

  while exists (select 1 from public.products where slug = v_slug) loop
    v_slug := p_base_slug || '-' || v_suffix;
    v_suffix := v_suffix + 1;
  end loop;

  insert into public.products (
    slug, name, description, price_cents, currency, category_id, color_name,
    placeholder_color, featured, is_published, is_demo, sort_order
  )
  values (
    v_slug,
    p_product ->> 'name',
    coalesce(p_product ->> 'description', ''),
    (p_product ->> 'price_cents')::integer,
    'EUR',
    (p_product ->> 'category_id')::uuid,
    coalesce(p_product ->> 'color_name', ''),
    p_product ->> 'placeholder_color',
    (p_product ->> 'featured')::boolean,
    (p_product ->> 'is_published')::boolean,
    false,
    (select coalesce(max(sort_order), 0) + 1 from public.products)
  )
  returning id into v_id;

  -- SKU, e.g. TL-3F2A9C1B-M (from the new product's ID, so it's unique).
  insert into public.product_variants (product_id, size, sku, stock_quantity)
  select v_id, s.size,
         'TL-' || upper(left(replace(v_id::text, '-', ''), 8)) || '-' || s.size,
         s.stock_quantity
  from jsonb_to_recordset(p_product -> 'sizes') as s(size text, stock_quantity integer);

  return jsonb_build_object('id', v_id, 'slug', v_slug);
end;
$$;


-- ---------- Edit a product and its sizes ------------------------------
-- Same p_product shape. Sizes in the list are added or have their stock
-- updated; sizes NOT in the list are removed. The slug (URL) never changes,
-- so existing links keep working.
create function public.admin_update_product(p_id uuid, p_product jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_slug text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if jsonb_typeof(p_product -> 'sizes') <> 'array'
     or jsonb_array_length(p_product -> 'sizes') not between 1 and 5 then
    raise exception 'invalid_input';
  end if;

  update public.products set
    name              = p_product ->> 'name',
    description       = coalesce(p_product ->> 'description', ''),
    price_cents       = (p_product ->> 'price_cents')::integer,
    category_id       = (p_product ->> 'category_id')::uuid,
    color_name        = coalesce(p_product ->> 'color_name', ''),
    placeholder_color = p_product ->> 'placeholder_color',
    featured          = (p_product ->> 'featured')::boolean,
    is_published      = (p_product ->> 'is_published')::boolean
  where id = p_id
  returning slug into v_slug;

  if v_slug is null then
    raise exception 'not_found';
  end if;

  -- Remove sizes that are no longer offered. Past orders keep their own
  -- copy of the size and price (order_items.variant_id is set to null).
  delete from public.product_variants v
  where v.product_id = p_id
    and v.size not in (
      select s.size from jsonb_to_recordset(p_product -> 'sizes') as s(size text, stock_quantity integer)
    );

  -- Add new sizes / update stock of existing ones.
  insert into public.product_variants (product_id, size, sku, stock_quantity)
  select p_id, s.size,
         'TL-' || upper(left(replace(p_id::text, '-', ''), 8)) || '-' || s.size,
         s.stock_quantity
  from jsonb_to_recordset(p_product -> 'sizes') as s(size text, stock_quantity integer)
  on conflict (product_id, size) do update set stock_quantity = excluded.stock_quantity;

  return jsonb_build_object('id', p_id, 'slug', v_slug);
end;
$$;

revoke execute on function public.admin_create_product(jsonb, text) from public, anon;
revoke execute on function public.admin_update_product(uuid, jsonb) from public, anon;
grant execute on function public.admin_create_product(jsonb, text) to authenticated;
grant execute on function public.admin_update_product(uuid, jsonb) to authenticated;
