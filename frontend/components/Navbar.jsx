// V2 navbar: a floating, centered, rounded "pill" with glass blur.
"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import SearchDialog from "@/components/SearchDialog";

const LINKS = [
  ["Home", "/"],
  ["Menu", "/menu"],
  ["Order", "/cart"],
  ["Contact", "/contact"],
  ["Admin", "/admin"],
];

export default function Navbar() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-5">
      <header className="w-full max-w-3xl">
        {/* The pill */}
        <nav className="relative flex items-center justify-between rounded-full border border-cream/10 bg-forest/85 px-5 py-2.5 text-cream shadow-lg shadow-forest/20 backdrop-blur-md sm:px-6">
          {/* Logo */}
          <Link href="/" className="font-display text-xl tracking-tight text-cream">
            Tasty <span className="italic text-mustard">Bites</span>
          </Link>

          {/* Centered links (absolute so logo/CTA widths don't shift them) */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
            {LINKS.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-medium uppercase tracking-[0.14em] text-cream/75 transition-colors hover:text-mustard"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            <SearchDialog className="hidden text-cream/80 transition-colors hover:text-mustard sm:block" />

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative text-cream/80 transition-colors hover:text-orange-soft"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-semibold leading-none text-cream">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Primary action — the one orange CTA */}
            <Link
              href="/menu"
              className="hidden rounded-full bg-orange px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22] sm:block"
            >
              Order
            </Link>

            {/* Mobile toggle */}
            <button
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
              className="text-cream md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown card */}
        {open && (
          <div className="mt-2 rounded-3xl border border-cream/10 bg-forest/95 p-2 text-cream shadow-lg backdrop-blur-md md:hidden">
            {LINKS.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-medium uppercase tracking-[0.14em] text-cream/80 transition-colors hover:bg-cream/10 hover:text-mustard"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/menu"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-2xl bg-orange px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-cream"
            >
              Order Now
            </Link>
          </div>
        )}
      </header>
    </div>
  );
}
