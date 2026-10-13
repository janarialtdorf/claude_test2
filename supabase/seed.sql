-- =====================================================================
-- DEMO DATA for Threadline — sample products for a learning project.
-- Not real items. Safe to run more than once ("on conflict do nothing").
-- Never run this against a production database.
-- =====================================================================

insert into public.categories (slug, name, description, sort_order) values
  ('tops',      'Tops',      'T-shirts, long-sleeves and shirts.', 1),
  ('bottoms',   'Bottoms',   'Trousers, jeans and skirts.',        2),
  ('outerwear', 'Outerwear', 'Jackets and coats.',                 3)
on conflict (slug) do nothing;

insert into public.products
  (slug, name, description, price_cents, currency, category_id,
   color_name, placeholder_color, featured, is_published, is_demo, sort_order)
select
  v.slug, v.name, v.description, v.price_cents, 'EUR', c.id,
  v.color_name, v.placeholder_color, v.featured, true, true, v.sort_order
from (values
  ('classic-cotton-t-shirt',     'Classic Cotton T-Shirt',     'A plain crew-neck T-shirt with a regular fit.',       1999, 'tops',      'Off-white',    '#e9e4d8', true,  1),
  ('striped-long-sleeve-tee',    'Striped Long-Sleeve Tee',    'A long-sleeve top with horizontal stripes.',          2799, 'tops',      'Navy / white', '#33415e', false, 2),
  ('linen-button-up-shirt',      'Linen Button-Up Shirt',      'A relaxed button-up shirt with a classic collar.',    4499, 'tops',      'Sage',         '#a3b18a', true,  3),
  ('relaxed-chino-trousers',     'Relaxed Chino Trousers',     'Chino trousers with a relaxed, straight leg.',        4999, 'bottoms',   'Khaki',        '#c4b48a', false, 4),
  ('straight-leg-jeans',         'Straight-Leg Jeans',         'Five-pocket jeans with a straight leg.',              5999, 'bottoms',   'Indigo',       '#3d4b6e', true,  5),
  ('pleated-midi-skirt',         'Pleated Midi Skirt',         'A pleated skirt that falls below the knee.',          3999, 'bottoms',   'Terracotta',   '#b5654a', false, 6),
  ('quilted-lightweight-jacket', 'Quilted Lightweight Jacket', 'A light quilted jacket with a snap-button front.',   7999, 'outerwear', 'Olive',        '#5b6142', true,  7),
  ('wool-blend-overcoat',        'Wool-Blend Overcoat',        'A knee-length overcoat with a notched collar.',      14999, 'outerwear', 'Charcoal',     '#3a3a3c', false, 8)
) as v(slug, name, description, price_cents, category_slug, color_name, placeholder_color, featured, sort_order)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Every product gets sizes XS–XL. Demo stock is 20 per size (never shown to
-- shoppers), except the sizes listed below, which are sold out (0).
insert into public.product_variants (product_id, size, sku, stock_quantity)
select
  p.id,
  s.size,
  'TL-' || lpad(p.sort_order::text, 3, '0') || '-' || s.size,
  case when (p.slug, s.size) in (
    ('classic-cotton-t-shirt', 'XL'),
    ('linen-button-up-shirt',  'S'),
    ('straight-leg-jeans',     'M'),
    ('pleated-midi-skirt',     'XS'),
    ('pleated-midi-skirt',     'S'),
    ('pleated-midi-skirt',     'M'),
    ('pleated-midi-skirt',     'L'),
    ('pleated-midi-skirt',     'XL'),
    ('wool-blend-overcoat',    'XS')
  ) then 0 else 20 end
from public.products p
cross join (values ('XS'), ('S'), ('M'), ('L'), ('XL')) as s(size)
where p.is_demo
on conflict (product_id, size) do nothing;
