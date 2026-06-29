// Dish-detail page (/menu/[id]) — full photo, details, add-to-cart, related.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Truck } from "lucide-react";
import { getMenuItem, getMenuItems } from "@/lib/menu-data";
import MenuCard from "@/components/MenuCard";
import AddToCartButton from "@/components/AddToCartButton";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = await getMenuItem(id);
  return { title: item ? `${item.name} · TastyBites` : "Dish · TastyBites" };
}

export default async function DishPage({ params }) {
  const { id } = await params;
  const item = await getMenuItem(id);
  if (!item) notFound();

  const all = await getMenuItems();
  const related = all
    .filter((i) => i.category === item.category && i.id !== item.id)
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <Link
        href="/menu"
        className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-olive"
      >
        <ArrowLeft className="h-4 w-4" /> Back to menu
      </Link>

      <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
        {/* Photo */}
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
          <img
            src={item.image}
            alt={item.name}
            className="aspect-square w-full object-cover"
          />
        </div>

        {/* Details */}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-mustard">
            {item.category}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">{item.name}</h1>

          <div className="mt-4 flex items-center gap-2 text-mustard">
            <Star className="h-5 w-5 fill-mustard" strokeWidth={0} />
            <span className="font-semibold text-foreground">{item.rating}</span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>

          <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
            {item.description}
          </p>

          <p className="mt-6 font-display text-4xl text-orange">
            ${item.price.toFixed(2)}
          </p>

          <div className="mt-8">
            <AddToCartButton item={item} />
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4 text-olive" /> Free delivery on orders over
            $20 · ready in ~30 min.
          </p>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-display text-2xl sm:text-3xl">
            More from {item.category}
          </h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
            {related.map((r) => (
              <MenuCard key={r.id} item={r} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
