-- TastyBites — initial schema + Row Level Security
-- Run this in the Supabase SQL editor (or via the Supabase CLI).

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

-- Profiles mirror auth.users with app-specific fields.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  default_address text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null,
  category_id uuid references public.categories (id) on delete set null,
  image_url text,
  rating numeric(2, 1) default 4.5,
  is_featured boolean not null default false,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  customer_name text not null,
  phone text,
  address text not null,
  subtotal numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  status text not null default 'paid'
    check (status in ('paid', 'preparing', 'out_for_delivery', 'delivered')),
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name text not null,
  price numeric(10, 2) not null,
  quantity int not null check (quantity > 0)
);

-- ─────────────────────────────────────────────────────────────
-- Auto-create a profile row when a new auth user signs up
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.menu_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- profiles: a user manages their own row; admins can read all.
create policy "profiles_select_own"  on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = id);

-- categories + menu_items: public read, admin write.
create policy "categories_read"      on public.categories for select using (true);
create policy "categories_admin"     on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "menu_items_read"      on public.menu_items for select using (true);
create policy "menu_items_admin"     on public.menu_items for all using (public.is_admin()) with check (public.is_admin());

-- orders: owners read their own; admins read/update all.
-- (Writes are performed server-side with the service-role key, which bypasses RLS.)
create policy "orders_select_own"    on public.orders for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_admin_update"  on public.orders for update using (public.is_admin());

create policy "order_items_select"   on public.order_items for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
  )
);
