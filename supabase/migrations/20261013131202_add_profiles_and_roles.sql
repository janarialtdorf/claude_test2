-- =====================================================================
-- Profiles and roles for logged-in staff.
--
-- Supabase Auth keeps accounts (email, password hash) in auth.users.
-- We add public.profiles — one row per account — to store the ROLE:
--   'user'  = logged in, but no special access (the default)
--   'admin' = can manage products
--
-- Roles can only be changed with SQL by the project owner. There is no
-- API or policy that lets anyone change their own (or anyone's) role.
-- =====================================================================

create table public.profiles (
  -- Same ID as the auth account; deleting the account deletes the profile.
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant all on table public.profiles to service_role;
-- Logged-in users may read profiles, but the policy below limits that to
-- their OWN row. No insert/update/delete grants: roles can't be changed
-- through the API.
grant select on table public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));


-- Create a profile automatically whenever an account is created.
-- "security definer" runs this with the function owner's rights, because
-- the sign-up process itself isn't allowed to write to public.profiles.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts created before this migration (if any) get a profile too.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;


-- is_admin(): true if the person making the request is an admin.
-- Used by the app's endpoints AND by database policies (in later
-- migrations), so the same rule is enforced in both places.
-- "security definer" lets it look up the role even where RLS would hide it;
-- it only ever checks the CURRENT user (auth.uid()), so it reveals nothing else.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
