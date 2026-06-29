// V2 card: the photo IS the card. Click the photo to zoom it in a lightbox;
// the circular orange button adds to the cart.
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MenuCard({ item }) {
  const { addToCart } = useCart();
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  // Reveal with a zoom-in once the card scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleAdd() {
    addToCart(item);
    toast.success(`${item.name} added to your order`);
  }

  return (
    <article
      ref={ref}
      className={`group relative aspect-[4/5] overflow-hidden rounded-[14px] ring-1 ring-forest/10 ${
        shown ? "zoom-in-show" : "zoom-in-hidden"
      }`}
    >
      {/* Photo — clicking it opens the zoom lightbox */}
      <Dialog>
        <DialogTrigger
          aria-label={`Zoom photo of ${item.name}`}
          className="absolute inset-0 z-0 cursor-zoom-in"
        >
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ease-out will-change-transform group-hover:scale-[1.15]"
          />
          <span className="absolute inset-0 block bg-gradient-to-t from-forest via-forest/45 to-transparent" />
        </DialogTrigger>

        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{item.name}</DialogTitle>
          </DialogHeader>
          <img
            src={item.image}
            alt={item.name}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-mustard">
                {item.category}
              </p>
              <h3 className="font-display text-xl">{item.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
              <Link
                href={`/menu/${item.id}`}
                className="mt-2 inline-block text-xs font-semibold uppercase tracking-[0.12em] text-olive transition-colors hover:text-orange"
              >
                View full details →
              </Link>
            </div>
            <button
              onClick={handleAdd}
              className="flex-none rounded-full bg-orange px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22]"
            >
              ${item.price.toFixed(2)} · Add
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating chip (non-blocking) */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-forest/70 px-2.5 py-1 backdrop-blur-sm">
        <Star className="h-3 w-3 fill-mustard" strokeWidth={0} />
        <span className="text-xs font-semibold text-cream">{item.rating}</span>
      </div>

      {/* Content overlay — pointer-events-none so clicks fall through to zoom,
          except the add button which re-enables them. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-mustard">
            {item.category}
          </p>
          <h3 className="truncate font-display text-xl leading-none text-cream">
            {item.name}
          </h3>
          <p className="mt-2 font-display text-lg text-cream/90">
            <span className="align-top text-xs text-cream/60">$</span>
            {item.price.toFixed(2)}
          </p>
        </div>

        <button
          onClick={handleAdd}
          aria-label={`Add ${item.name} to order`}
          className="pointer-events-auto grid h-11 w-11 flex-none place-items-center rounded-full bg-orange text-cream shadow-md transition-transform hover:bg-[#b34d22] active:scale-90"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
}
