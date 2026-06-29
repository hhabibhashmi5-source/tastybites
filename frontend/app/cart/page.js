// The CART page (/cart) — edit items, fill details, pay via Stripe Checkout.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Minus, Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { isRealName, NAME_ERROR } from "@/lib/validate-name";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FREE_DELIVERY_THRESHOLD = 20;
const DELIVERY_FEE = 2.99;
const ORDER_KEY = "tastybites-order";
const CART_KEY = "tastybites-cart";

export default function CartPage() {
  const {
    cart,
    addToCart,
    decreaseQty,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [errors, setErrors] = useState({ name: "", email: "" });
  const [placed, setPlaced] = useState(null);
  const [loading, setLoading] = useState(false);

  const delivery = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = totalPrice + delivery;

  // Handle the redirect back from Stripe.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      const sessionId = params.get("session_id") || "";
      const saved = JSON.parse(localStorage.getItem(ORDER_KEY) || "null");
      const ref = sessionId.slice(-8).toUpperCase();

      // Save the paid order to the database, then show the confirmation.
      (async () => {
        try {
          const res = await fetch("/api/order/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              items: saved?.items || [],
              name: saved?.name,
            }),
          });
          const data = await res.json();
          setPlaced({
            name: data?.name || saved?.name || "there",
            total: data?.total ?? saved?.total ?? 0,
            ref,
          });
        } catch {
          // Even if saving hiccups, still thank the customer.
          setPlaced({ name: saved?.name || "there", total: saved?.total || 0, ref });
        }
      })();

      localStorage.removeItem(ORDER_KEY);
      localStorage.removeItem(CART_KEY); // ensure cart loads empty
      clearCart();
      window.history.replaceState({}, "", "/cart");
    } else if (params.get("canceled")) {
      toast("Checkout canceled — your cart is still here.");
      window.history.replaceState({}, "", "/cart");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill name + email from the signed-in customer's profile, if any. Never
  // clobbers what the shopper has already typed. (Phone + delivery address are
  // still collected by Stripe Checkout, so they aren't prefilled here.)
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setForm((f) => ({
        ...f,
        name: f.name || profile?.full_name || "",
        email: f.email || user.email || "",
      }));
    })();
    return () => {
      active = false;
    };
  }, []);

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      // Clear that field's error as soon as the user starts fixing it.
      setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
    };
  }

  async function placeOrder(e) {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    // Reject junk: digits/symbols, too-short, AND unpronounceable letter-mash
    // like "osooiahwo" (see lib/validate-name.js for the heuristics + caveats).
    const looksLikeName = isRealName(name);
    const looksLikeEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

    // Collect inline errors so the message stays under the field until fixed.
    const nextErrors = {
      name: looksLikeName ? "" : NAME_ERROR,
      email: looksLikeEmail ? "" : "Enter a valid email — e.g. “you@example.com”.",
    };
    if (nextErrors.name || nextErrors.email) {
      setErrors(nextErrors);
      toast.error(nextErrors.name || nextErrors.email);
      return;
    }
    setErrors({ name: "", email: "" });
    // Phone + delivery address are collected (and required) by Stripe Checkout,
    // so we don't ask for them twice here.

    setLoading(true);
    try {
      // Remember who's ordering so we can greet them on the success screen.
      localStorage.setItem(
        ORDER_KEY,
        JSON.stringify({ name, total: grandTotal, items: cart })
      );
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, name, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url; // off to Stripe
    } catch (err) {
      toast.error(err.message || "Could not start checkout.");
      setLoading(false);
    }
  }

  // ----- Confirmation (after Stripe success) -----
  if (placed) {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-olive" strokeWidth={1.5} />
        <h1 className="mt-6 font-display text-4xl">Thank you, {placed.name}!</h1>
        <p className="mt-3 text-muted-foreground">
          Your payment went through.
          We&apos;re firing up the grill — expect it in about 30 minutes.
        </p>
        {placed.total > 0 && (
          <p className="mt-6 font-display text-2xl text-orange">
            ${placed.total.toFixed(2)}
          </p>
        )}
        <Link
          href="/menu"
          className="mt-8 inline-block rounded-full bg-orange px-8 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22]"
        >
          Order something else
        </Link>
      </main>
    );
  }

  // ----- Empty cart -----
  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-6xl">🍽️</p>
        <h1 className="mt-6 font-display text-3xl">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Add a few things from the menu and they&apos;ll show up here.
        </p>
        <Link
          href="/menu"
          className="mt-8 inline-block rounded-full bg-orange px-8 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22]"
        >
          Browse the menu
        </Link>
      </main>
    );
  }

  // ----- Cart + checkout -----
  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
        Your order
      </p>
      <h1 className="font-display text-4xl">Cart ({totalItems})</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div>
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border py-4"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 flex-none rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg leading-tight">
                  {item.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  ${item.price.toFixed(2)} each
                </p>
              </div>

              {/* Controls cluster — wraps onto its own full-width row on small
                  phones so the quantity stepper, line total and remove button
                  never get squeezed against the name. */}
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decreaseQty(item.id)}
                    aria-label="Decrease quantity"
                    className="grid h-8 w-8 place-items-center rounded-full border border-border transition-colors hover:border-olive"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => addToCart(item)}
                    aria-label="Increase quantity"
                    className="grid h-8 w-8 place-items-center rounded-full border border-border transition-colors hover:border-olive"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="w-20 text-right font-display text-lg text-orange">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-destructive"
          >
            Clear cart
          </button>
        </div>

        {/* Summary + checkout */}
        <form
          onSubmit={placeOrder}
          className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-28"
        >
          <h2 className="font-display text-xl">Order summary</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>${totalPrice.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>
                {delivery === 0 ? (
                  <span className="text-olive">FREE</span>
                ) : (
                  `$${delivery.toFixed(2)}`
                )}
              </dd>
            </div>
            {delivery > 0 && (
              <p className="text-xs text-muted-foreground">
                Add ${(FREE_DELIVERY_THRESHOLD - totalPrice).toFixed(2)} more for
                free delivery.
              </p>
            )}
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-4">
            <span className="text-sm uppercase tracking-[0.14em] text-muted-foreground">
              Total
            </span>
            <span className="font-display text-2xl text-orange">
              ${grandTotal.toFixed(2)}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={update("name")}
                placeholder="Your name"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-xs text-destructive" role="alert">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive" role="alert">
                  {errors.email}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;ll enter your delivery address and phone number securely
              on the next (Stripe) step.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-orange py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22] disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Redirecting…
              </>
            ) : (
              <>Pay with card · ${grandTotal.toFixed(2)}</>
            )}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Secure checkout by Stripe · test mode
          </p>
        </form>
      </div>
    </main>
  );
}
