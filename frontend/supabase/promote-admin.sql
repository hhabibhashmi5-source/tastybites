-- Promote a user to admin so they can use /admin.
--
-- How to use:
--   1. Create the account first by signing up through Supabase Auth
--      (Supabase Dashboard → Authentication → Users → "Add user", or your app's
--      sign-up flow). A matching public.profiles row is created automatically
--      by the on_auth_user_created trigger (see migration 0001).
--   2. Run ONE of the statements below in the Supabase SQL editor, using the
--      email of the account you want to make an admin.

-- Promote by email (recommended):
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and u.email = 'you@example.com';   -- <-- change this

-- Verify it worked:
select u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';

-- To revoke admin later:
-- update public.profiles p
-- set role = 'customer'
-- from auth.users u
-- where u.id = p.id and u.email = 'you@example.com';
