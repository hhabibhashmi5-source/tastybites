-- Customer reviews / testimonials.
-- Visitors submit a review through a server route (service-role key). Reviews
-- start hidden (is_approved = false); an admin approves the ones that should
-- appear on the home page. Only approved reviews are publicly readable.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  rating int not null default 5 check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) between 1 and 500),
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Public read: only approved reviews (used by the home page via the anon key).
-- No function call here, so it's safe for the anon role.
drop policy if exists "reviews_read_approved" on public.reviews;
create policy "reviews_read_approved" on public.reviews
  for select
  using (is_approved = true);

-- Admins can read everything and approve / hide / delete reviews.
-- (Customer inserts happen server-side with the service-role key, which
-- bypasses RLS — so there's intentionally no public insert policy.)
drop policy if exists "reviews_admin" on public.reviews;
create policy "reviews_admin" on public.reviews
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
