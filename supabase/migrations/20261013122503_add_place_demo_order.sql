-- =====================================================================
-- place_demo_order: creates a demo order in ONE transaction.
--
-- The browser only says WHICH sizes and HOW MANY. Everything else — prices,
-- totals, stock — is decided here, from the database's own data:
--   1. check the item list is well-formed (1–20 lines, quantity 1–10, no duplicates)
--   2. lock the size rows being bought, so two orders can't both take the last one
--   3. check every size exists, belongs to a published product, and has enough stock
--   4. calculate prices and totals from the products table
--   5. save the order + items (with name/size/price snapshots) and reduce stock
-- If anything fails, PostgreSQL rolls back the whole transaction: nothing is saved.
--
-- Errors are raised with short codes (e.g. 'insufficient_stock') that the
-- Next.js server turns into friendly messages.
--
-- Only the server (service_role / secret key) may call this function.
-- =====================================================================

create function public.place_demo_order(
  p_customer_name text,
  p_email         text,
  p_address_line1 text,
  p_address_line2 text,
  p_city          text,
  p_postal_code   text,
  p_country       text,
  p_items         jsonb  -- e.g. [{"variant_id": "…uuid…", "quantity": 2}]
)
returns jsonb
language plpgsql
-- Runs with the caller's permissions (service_role), not elevated ones.
security invoker
-- Fixed search_path: table names below are always schema-qualified.
set search_path = ''
as $$
declare
  v_line_count     integer;
  v_found_count    integer;
  v_short_variants text;
  v_currency_count integer;
  v_currency       text;
  v_subtotal       integer;
  v_order_id       uuid;
  v_result_items   jsonb;
begin
  -- 1. Well-formed item list ------------------------------------------
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_items';
  end if;

  v_line_count := jsonb_array_length(p_items);
  if v_line_count < 1 or v_line_count > 20 then
    raise exception 'invalid_items';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as e
    where jsonb_typeof(e) <> 'object'
       or coalesce(e ->> 'variant_id', '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(e ->> 'quantity', '') !~ '^[0-9]{1,2}$'
       or (e ->> 'quantity')::integer not between 1 and 10
  ) then
    raise exception 'invalid_items';
  end if;

  -- The same size may appear only once (quantities are already combined).
  if (select count(distinct e ->> 'variant_id') from jsonb_array_elements(p_items) as e) <> v_line_count then
    raise exception 'invalid_items';
  end if;

  -- 2. Lock the size rows (in a fixed order, which avoids deadlocks) ----
  perform 1
  from public.product_variants v
  where v.id in (select (e ->> 'variant_id')::uuid from jsonb_array_elements(p_items) as e)
  order by v.id
  for update;

  -- 3. Every size must exist and belong to a published product ---------
  select count(*) into v_found_count
  from jsonb_to_recordset(p_items) as i(variant_id uuid, quantity integer)
  join public.product_variants v on v.id = i.variant_id
  join public.products p on p.id = v.product_id
  where p.is_published;

  if v_found_count <> v_line_count then
    raise exception 'unknown_item';
  end if;

  -- ...and have enough stock. The detail lists which sizes are short.
  select string_agg(v.id::text, ',') into v_short_variants
  from jsonb_to_recordset(p_items) as i(variant_id uuid, quantity integer)
  join public.product_variants v on v.id = i.variant_id
  where i.quantity > v.stock_quantity;

  if v_short_variants is not null then
    raise exception 'insufficient_stock' using detail = v_short_variants;
  end if;

  -- 4. Prices and totals from the database -----------------------------
  select count(distinct p.currency), min(p.currency), sum(p.price_cents * i.quantity)
  into v_currency_count, v_currency, v_subtotal
  from jsonb_to_recordset(p_items) as i(variant_id uuid, quantity integer)
  join public.product_variants v on v.id = i.variant_id
  join public.products p on p.id = v.product_id;

  if v_currency_count <> 1 then
    raise exception 'mixed_currency';
  end if;

  -- 5. Save the order, its items, and reduce stock ---------------------
  -- Shipping is 0 for demo orders; total = subtotal + shipping (also
  -- enforced by a CHECK constraint on the table).
  insert into public.orders (
    customer_name, email, address_line1, address_line2, city, postal_code, country,
    subtotal_cents, shipping_cents, total_cents, currency
  ) values (
    p_customer_name, p_email, p_address_line1, coalesce(p_address_line2, ''), p_city,
    p_postal_code, p_country, v_subtotal, 0, v_subtotal, v_currency
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, variant_id, product_name, size, sku, unit_price_cents, quantity, line_total_cents
  )
  select v_order_id, v.id, p.name, v.size, v.sku, p.price_cents, i.quantity, p.price_cents * i.quantity
  from jsonb_to_recordset(p_items) as i(variant_id uuid, quantity integer)
  join public.product_variants v on v.id = i.variant_id
  join public.products p on p.id = v.product_id;

  update public.product_variants v
  set stock_quantity = v.stock_quantity - i.quantity
  from jsonb_to_recordset(p_items) as i(variant_id uuid, quantity integer)
  where v.id = i.variant_id;

  -- Return a summary for the confirmation screen (no personal data).
  select jsonb_agg(
           jsonb_build_object(
             'product_name', oi.product_name,
             'size', oi.size,
             'quantity', oi.quantity,
             'unit_price_cents', oi.unit_price_cents,
             'line_total_cents', oi.line_total_cents
           ) order by oi.product_name, oi.size
         )
  into v_result_items
  from public.order_items oi
  where oi.order_id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'subtotal_cents', v_subtotal,
    'shipping_cents', 0,
    'total_cents', v_subtotal,
    'currency', v_currency,
    'items', v_result_items
  );
end;
$$;

-- Only the server may place orders. (Supabase grants new functions to the
-- public roles by default, so we remove that explicitly.)
revoke execute on function public.place_demo_order(text, text, text, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.place_demo_order(text, text, text, text, text, text, text, jsonb)
  to service_role;
