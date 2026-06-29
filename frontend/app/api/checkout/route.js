// Server-only route: creates a Stripe Checkout session from the cart and
// returns the hosted-checkout URL. Prices are recomputed from the DATABASE
// (never trusted from the browser). The secret key never leaves the server.
import Stripe from "stripe";
import { priceOrder } from "@/lib/order-pricing";
import { cartToMetadata } from "@/lib/order-fulfillment";
import { createClient } from "@/lib/supabase/server";

// A real name: letters/spaces/.'- only (no digits), 2+ letters.
function isValidName(name) {
  const n = String(name ?? "").trim();
  return (
    n.length >= 2 &&
    n.length <= 60 &&
    /^[\p{L}][\p{L}\s.'-]*$/u.test(n) &&
    (n.match(/\p{L}/gu) || []).length >= 2
  );
}

function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email ?? "").trim());
}

export async function POST(req) {
  try {
    const { items, name, email } = await req.json();

    // No checkout session (and therefore no transaction) is created unless the
    // name and email are valid. This is the server-side gate; the cart form
    // checks too, but a direct POST must not bypass it.
    if (!isValidName(name)) {
      return Response.json(
        { error: "A valid name (letters only) is required." },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return Response.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    // Recompute prices/lines from the database — ignore browser-supplied prices.
    let priced;
    try {
      priced = await priceOrder(items);
    } catch (e) {
      return Response.json({ error: e.message }, { status: 400 });
    }

    // If the shopper is signed in, remember their id so the saved order can be
    // attached to their account (powers /account order history). Anonymous
    // checkout still works — user_id just stays null.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = req.headers.get("origin") || new URL(req.url).origin;

    // Build line items from the trusted (database) prices, in cents.
    const line_items = priced.lines.map((l) => ({
      price_data: {
        currency: "usd",
        product_data: { name: l.name },
        unit_amount: Math.round(l.price * 100),
      },
      quantity: l.quantity,
    }));

    // Add delivery as a line item unless the order qualifies for free delivery.
    if (priced.delivery > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Delivery" },
          unit_amount: Math.round(priced.delivery * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      // Stash the validated cart + name on the session so the webhook can save
      // the order reliably even if the customer never returns to the site.
      metadata: cartToMetadata(
        priced.lines.map((l) => ({ id: l.id, quantity: l.quantity })),
        {
          customer_name: String(name).trim().slice(0, 200),
          ...(user ? { user_id: user.id } : {}),
        }
      ),
      // Use the validated email — Stripe pre-fills it and sends the receipt here.
      customer_email: String(email).trim(),
      // Collect full billing details (name + address) alongside the card.
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      // Collect a delivery address — this is where the food actually ships,
      // and may differ from the card's billing address.
      shipping_address_collection: { allowed_countries: ["US"] },
      success_url: `${origin}/cart?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?canceled=1`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return Response.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
