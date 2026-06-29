// Server-only: called when the customer returns from Stripe. Verifies the
// payment really happened, then saves the order + items to the database.
// Idempotent: the same Stripe session is never saved twice.
import Stripe from "stripe";
import { priceOrder } from "@/lib/order-pricing";
import { isRealName } from "@/lib/validate-name";
import { createAdminClient } from "@/lib/supabase/admin";

function formatAddress(addr) {
  if (!addr) return "";
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
    .filter(Boolean)
    .join(", ");
}

// Accept only a real-looking name; otherwise store a neutral fallback so junk
// like "12344joy4yl" or "osooiahwo" never lands on the order record. Uses the
// same shared heuristic as the cart form so the two can't drift apart.
function cleanName(name) {
  const n = String(name ?? "").trim();
  return isRealName(n) ? n : "Customer";
}

export async function POST(req) {
  try {
    const { sessionId, items, name: providedName } = await req.json();
    if (!sessionId) {
      return Response.json({ error: "Missing session id." }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const admin = createAdminClient();

    // If we already saved this session, return it (handles page refreshes).
    const { data: existing } = await admin
      .from("orders")
      .select("id, customer_name, total")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (existing) {
      return Response.json({
        id: existing.id,
        name: existing.customer_name,
        total: Number(existing.total),
      });
    }

    // Confirm the payment really happened (cannot be faked from the browser).
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return Response.json({ error: "Payment not completed." }, { status: 402 });
    }

    // Recompute from the DB and make sure the amount paid matches.
    let priced;
    try {
      priced = await priceOrder(items);
    } catch (e) {
      return Response.json({ error: e.message }, { status: 400 });
    }
    if (priced.amountCents !== session.amount_total) {
      return Response.json(
        { error: "Order total mismatch." },
        { status: 400 }
      );
    }

    // Contact info comes from Stripe (verified), not the browser. We REQUIRE a
    // real name, phone, and DELIVERY address — no placeholder fallbacks. If any
    // is missing we reject rather than save a half-blank order the kitchen
    // can't fulfil. (Stripe is configured to collect all three as required, so
    // this should only ever trip if that config changes.)
    const details = session.customer_details || {};
    const shipping = session.collected_information?.shipping_details || null;
    // Prefer the validated cart-form name; fall back to Stripe's. cleanName
    // strips junk (digits etc.) so only a real, letters-only name is stored.
    const customerName = cleanName(
      providedName || shipping?.name || details.name
    );
    const phone = (details.phone || "").trim();
    const address = formatAddress(shipping?.address).trim();

    if (!phone || !address) {
      console.error(
        `Order confirm: missing delivery details for session ${sessionId}`,
        { hasPhone: !!phone, hasAddress: !!address }
      );
      return Response.json(
        {
          error: "Order is missing required delivery details (phone or address).",
        },
        { status: 400 }
      );
    }

    // Save the order, then its line items.
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        customer_name: customerName,
        phone,
        address,
        subtotal: priced.subtotal,
        delivery_fee: priced.delivery,
        total: priced.total,
        status: "paid",
        stripe_session_id: sessionId,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError.message);
      return Response.json({ error: "Could not save order." }, { status: 500 });
    }

    const itemRows = priced.lines.map((l) => ({
      order_id: order.id,
      menu_item_id: l.id,
      name: l.name,
      price: l.price,
      quantity: l.quantity,
    }));
    const { error: itemsError } = await admin.from("order_items").insert(itemRows);
    if (itemsError) {
      console.error("Order items insert error:", itemsError.message);
      // The order row exists; report success but log the gap.
    }

    return Response.json({
      id: order.id,
      name: customerName,
      total: priced.total,
    });
  } catch (err) {
    console.error("Order confirm error:", err);
    return Response.json(
      { error: "Could not confirm order." },
      { status: 500 }
    );
  }
}
