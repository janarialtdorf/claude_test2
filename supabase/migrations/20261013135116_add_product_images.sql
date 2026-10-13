-- =====================================================================
-- Product image galleries.
--
-- The image FILES live in Supabase Storage (bucket "product-images");
-- this table only stores where each file is, its alt text and its order.
-- The image with the lowest sort_order is the product's main image.
--
-- Who can do what:
--   * Everyone can view images of published products (public bucket).
--   * Only admins can upload, change or delete images (RLS + storage policies).
-- =====================================================================

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  -- Deleting a product deletes its image rows (the app removes the files).
  product_id   uuid not null references public.products (id) on delete cascade,
  -- Path inside the bucket, e.g. "<product id>/<random id>.webp".
  storage_path text not null unique check (char_length(storage_path) between 1 and 300),
  -- Describes the image for screen readers; required.
  alt_text     text not null check (char_length(alt_text) between 1 and 300),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index product_images_product_id_sort_idx on public.product_images (product_id, sort_order);

-- At most 8 images per product — enforced by the database itself, so even
-- two uploads at the same moment can't go over the limit.
create function public.enforce_product_image_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Lock the product row so simultaneous uploads are counted one by one.
  perform 1 from public.products where id = new.product_id for update;
  if (select count(*) from public.product_images where product_id = new.product_id) >= 8 then
    raise exception 'image_limit_reached';
  end if;
  return new;
end;
$$;

create trigger product_images_limit
  before insert on public.product_images
  for each row execute function public.enforce_product_image_limit();


-- ---------- Table permissions -----------------------------------------

alter table public.product_images enable row level security;

revoke all on table public.product_images from anon, authenticated;
grant all on table public.product_images to service_role;
grant select on table public.product_images to anon, authenticated;
grant insert, update, delete on table public.product_images to authenticated;

create policy "Anyone can read images of published products"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.is_published
    )
  );

create policy "Admins can read all images"
  on public.product_images for select to authenticated
  using ((select public.is_admin()));

create policy "Admins can add images"
  on public.product_images for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update images"
  on public.product_images for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete images"
  on public.product_images for delete to authenticated
  using ((select public.is_admin()));


-- ---------- Storage bucket for the files ------------------------------
-- public = anyone can VIEW files by their URL (needed for a shop).
-- The bucket itself also refuses files over 5 MB or of other types.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Only admins may upload, replace, delete or list files in this bucket.
create policy "Admins can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admins can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admins can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admins can list product images"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
