// A working search: opens a dialog, filters the menu live, add straight to cart.
"use client";

import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function SearchDialog({ className = "" }) {
  const { addToCart } = useCart();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState([]);

  // Load the menu from Supabase the first time the dialog opens.
  useEffect(() => {
    if (!open || menu.length) return;
    const url =
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items` +
      `?select=id,name,description,price,image_url,rating,categories(name)` +
      `&is_available=eq.true&order=name`;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
      .then((r) => r.json())
      .then((rows) =>
        setMenu(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            price: Number(r.price),
            image: r.image_url,
            rating: Number(r.rating),
            category: r.categories?.name ?? "",
          }))
        )
      )
      .catch(() => {});
  }, [open, menu.length]);

  const q = query.trim().toLowerCase();
  const results = q
    ? menu.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      )
    : menu;

  function add(item) {
    addToCart(item);
    toast.success(`${item.name} added to your order`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger aria-label="Search the menu" className={className}>
        <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </DialogTrigger>

      <DialogContent className="max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="sr-only">Search the menu</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search burgers, drinks, desserts…"
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No dishes match “{query}”.
            </p>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-12 w-12 flex-none rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <span className="font-display text-sm text-orange">
                  ${item.price.toFixed(2)}
                </span>
                <button
                  onClick={() => add(item)}
                  aria-label={`Add ${item.name}`}
                  className="grid h-8 w-8 flex-none place-items-center rounded-full bg-orange text-cream transition-colors hover:bg-[#b34d22]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
