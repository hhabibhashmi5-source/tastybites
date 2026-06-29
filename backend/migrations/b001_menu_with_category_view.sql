-- Migration: create a read-only view that joins menu items with their category.
--
-- A "view" is a saved query you can select from like a table. This one does NOT
-- change or store any data — it just makes it easy to read menu items together
-- with their category name in a single query.
--
-- "create or replace" means re-running this is harmless: it just redefines the
-- view if it already exists.

create or replace view public.menu_with_category as
select
  m.id,
  m.name,
  m.description,
  m.price,
  m.rating,
  m.is_featured,
  m.is_available,
  m.image_url,
  c.name as category_name,
  m.created_at
from public.menu_items m
left join public.categories c on c.id = m.category_id;
