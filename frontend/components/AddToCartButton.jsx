// Quantity stepper + add-to-cart, used on the dish-detail page.
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function AddToCartButton({ item }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  function add() {
    for (let i = 0; i < qty; i++) addToCart(item);
    toast.success(`${qty} × ${item.name} added to your order`);
    setQty(1);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 rounded-full border border-border px-3 py-2">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-secondary"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center font-medium">{qty}</span>
        <button
          onClick={() => setQty((q) => q + 1)}
          aria-label="Increase quantity"
          className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-secondary"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={add}
        className="rounded-full bg-orange px-8 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22]"
      >
        Add to order · ${(item.price * qty).toFixed(2)}
      </button>
    </div>
  );
}
