-- TastyBites — seed data (migrated from lib/menu.js)
-- Safe to re-run: only inserts rows that don't already exist.

insert into public.categories (name, sort_order) values
  ('Fast Food', 1),
  ('Drinks', 2),
  ('Desserts', 3)
on conflict (name) do nothing;

insert into public.menu_items (name, description, price, category_id, image_url, rating, is_featured)
select v.name, v.description, v.price, c.id, v.image_url, v.rating, v.is_featured
from (values
  ('Classic Beef Burger', 'Juicy beef patty, cheddar, lettuce & special sauce.', 6.99, 'Fast Food', '/images/burger.jpg', 4.8, true),
  ('Crispy Chicken Wings', 'Six pieces of golden, crispy spiced wings.', 5.49, 'Fast Food', '/images/wings.jpg', 4.6, false),
  ('Loaded Fries', 'Fries topped with cheese sauce and herbs.', 3.99, 'Fast Food', '/images/fries.jpg?v=2', 4.7, true),
  ('Pepperoni Pizza Slice', 'Stone-baked slice loaded with pepperoni.', 4.25, 'Fast Food', '/images/pizza.jpg', 4.9, false),
  ('Chicken Hot Dog', 'Grilled sausage in a soft bun with mustard.', 3.50, 'Fast Food', '/images/hotdog.jpg', 4.4, false),
  ('Fresh Cola', 'Chilled fizzy cola over ice.', 1.99, 'Drinks', '/images/cola.jpg', 4.3, false),
  ('Iced Coffee', 'Cold brew with milk and a hint of vanilla.', 2.99, 'Drinks', '/images/coffee.jpg', 4.8, true),
  ('Orange Juice', 'Freshly squeezed, 100% real oranges.', 2.49, 'Drinks', '/images/juice.jpg', 4.5, false),
  ('Strawberry Milkshake', 'Thick, creamy shake topped with cream.', 3.49, 'Drinks', '/images/milkshake.jpg', 4.7, false),
  ('Chocolate Brownie', 'Warm fudgy brownie with a molten center.', 3.25, 'Desserts', '/images/brownie.jpg', 4.9, true),
  ('Vanilla Ice Cream', 'Two scoops of creamy vanilla.', 2.50, 'Desserts', '/images/icecream.jpg', 4.6, false),
  ('Glazed Donut', 'Soft donut with a sweet sugar glaze.', 1.75, 'Desserts', '/images/donut.jpg', 4.5, false),
  ('Cheesecake Slice', 'Rich New York style cheesecake.', 3.99, 'Desserts', '/images/cheesecake.jpg', 4.8, false)
) as v(name, description, price, cat, image_url, rating, is_featured)
join public.categories c on c.name = v.cat
where not exists (
  select 1 from public.menu_items m where m.name = v.name
);
