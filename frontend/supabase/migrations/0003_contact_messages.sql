-- Contact form submissions, with DB-level validation.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text not null check (char_length(trim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Visitors submit via a server route (service-role key); only admins can read.
drop policy if exists "contact_admin_select" on public.contact_messages;
create policy "contact_admin_select" on public.contact_messages
  for select to authenticated
  using (private.is_admin());
