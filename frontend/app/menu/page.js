// The MENU page (/menu) — fetches from Supabase, renders client tabs.
import MenuTabs from "@/components/MenuTabs";
import { getCategories, getMenuItems } from "@/lib/menu-data";

export const revalidate = 60;

export default async function MenuPage() {
  const [categories, items] = await Promise.all([
    getCategories(),
    getMenuItems(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
        The full list
      </p>
      <h1 className="font-display text-4xl sm:text-5xl">Our Menu</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Choose a course and add what you like — your order builds in the cart.
      </p>

      <MenuTabs categories={categories} items={items} />
    </main>
  );
}
