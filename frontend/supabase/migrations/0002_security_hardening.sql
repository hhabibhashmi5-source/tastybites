-- Security hardening (applied after 0001_init.sql) — clears Supabase advisor warnings.
-- - SECURITY DEFINER functions must not be public RPC endpoints.
-- - Admin check lives in a non-API-exposed `private` schema.
-- - Policies use explicit TO / WITH CHECK.

-- handle_new_user is a trigger only — remove all API/role execute access.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Admin check in a private (non-exposed) schema, granted only where RLS needs it.
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- Recreate policies using private.is_admin() with explicit TO / WITH CHECK.
drop policy if exists "profiles_select_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;
drop policy if exists "categories_admin"     on public.categories;
drop policy if exists "menu_items_admin"     on public.menu_items;
drop policy if exists "orders_select_own"    on public.orders;
drop policy if exists "orders_admin_update"  on public.orders;
drop policy if exists "order_items_select"   on public.order_items;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id or private.is_admin());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "categories_admin" on public.categories
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "menu_items_admin" on public.menu_items
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "orders_select_own" on public.orders
  for select to authenticated
  using (auth.uid() = user_id or private.is_admin());

create policy "orders_admin_update" on public.orders
  for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "order_items_select" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or private.is_admin())
    )
  );

drop function if exists public.is_admin();
