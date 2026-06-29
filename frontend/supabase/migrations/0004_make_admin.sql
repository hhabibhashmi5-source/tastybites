-- Promote a user to admin so they can use /admin.
--
-- PREREQUISITE: the auth user must already exist. Create it first in the
-- Supabase dashboard → Authentication → Users → "Add user" (set an email +
-- password and tick "Auto Confirm"). The handle_new_user() trigger from
-- 0001_init.sql will have created the matching public.profiles row.
--
-- Then run this (change the email if needed), in the Supabase SQL editor:

update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and u.email = 'hhabibhashmi@gmail.com';

-- Verify:
--   select u.email, p.role
--   from public.profiles p join auth.users u on u.id = p.id
--   where p.role = 'admin';
