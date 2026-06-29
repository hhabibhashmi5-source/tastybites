// Shared order-saving logic used by BOTH the browser-redirect confirm route
// (app/api/order/confirm) and the Stripe webhook (app/api/stripe/webhook).
//
// Why one shared function: a paid order must be saved exactly once, no matter
// which path fires first (or if both do). Saving is idempotent on
// stripe_session_id, and the cart contents are read from the Stripe session's
// metadata so the webhook can reconstruct the order without the browser.
import { priceOrder } from "@/lib/order-pricing";
import { isRealName } from "@/lib/validate-name";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe metadata values are capped at 500 chars each; chunk under that.
const CART_CHUNK_SIZE = 450;

function formatAddress(addr) {
  if (!addr) return "";
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
    .filter(Boolean)
    .join(", ");
}

// Accept only a real-looking name; otherwise store a neutral fallback so junk
// like "12344joy4yl" never lands on the order record.
function cleanName(name) {
  const n = String(name ?? "").trim();
  return isRealName(n) ? n : "Customer";
}

// Encode the cart ([{ id, quantity }]) into Stripe-session metadata so the
// webhook can rebuild the order. Splits the JSON across cart_0..cart_N keys to
// stay under Stripe's per-value length limit.
export function cartToMetadata(items, extra = {}) {
  const compact = items.map((i) => ({ id: i.id, q: Number(i.quantity) }));
  const json = JSON.stringify(compact);
  const meta = { ...extra };
  let n = 0;
  for (let i = 0; i < json.length; i += CART_CHUNK_SIZE) {
    meta[`cart_${n}`] = json.slice(i, i + CART_CHUNK_SIZE);
    n += 1;
  }
  meta.cart_chunks = String(n);
  return meta;
}

// Rebuild the cart ([{ id, quantity }]) from session metadata, or null if absent.
export function cartFromMetadata(metadata) {
  if (!metadata) return null;
  const n = Number(metadata.cart_chunks || 0);
  if (!n) return null;
  let json = "";
  for (let i = 0; i < n; i += 1) json += metadata[`cart_${i}`] ?? "";
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((x) => ({ id: x.id, quantity: x.q }));
  } catch {
    return null;
  }
}

// Validation/business errors (vs. unexpected server errors) — callers map these
// to a 4xx response instead of 500.
export class OrderError extends Error {}

// Idempotently save a PAID Checkout session as an order plus its line items.
// `opts.items` / `opts.name` (from the browser) take priority; otherwise the
// cart is read from the session metadata. Returns
// { id, name, total, alreadyExisted }.
export async function saveOrderFromSession(session, opts = {}) {
  const admin = createAdminClient();
  const sessionId = session.id;

  // Already saved? Return it (handles page refreshes AND webhook-vs-confirm races).
  const { data: existing } = await admin
    .from("orders")
    .select("id, customer_name, total")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (existing) {
    return {
      id: existing.id,
      name: existing.customer_name,
      total: Number(existing.total),
      alreadyExisted: true,
    };
  }

  if (session.payment_status !== "paid") {
    throw new OrderError("Payment not completed.");
  }

  // Prefer browser-supplied items; fall back to the session metadata.
  const items =
    opts.items && opts.items.length ? opts.items : cartFromMetadata(session.metadata);
  if (!items || !items.length) {
    throw new OrderError("No cart items found for this session.");
  }

  // Recompute from the DB and confirm the amount paid matches.
  let priced;
  try {
    priced = await priceOrder(items);
  } catch (e) {
    throw new OrderError(e.message);
  }
  if (priced.amountCents !== session.amount_total) {
    throw new OrderError("Order total mismatch.");
  }

  // Contact + delivery info comes from Stripe (verified). Require name source,
  // phone, and a delivery address — no half-blank orders the kitchen can't fill.
  const details = session.customer_details || {};
  const shipping = session.collected_information?.shipping_details || null;
  const customerName = cleanName(
    opts.name || session.metadata?.customer_name || shipping?.name || details.name
  );
  const phone = (details.phone || "").trim();
  const address = formatAddress(shipping?.address).trim();
  if (!phone || !address) {
    throw new OrderError(
      "Order is missing required delivery details (phone or address)."
    );
  }

  // Attach the order to a customer account when checkout stashed the user id in
  // the session metadata (anonymous checkout leaves this null).
  const userId = session.metadata?.user_id || null;

  // Insert the order.
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
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
    // 23505 = unique violation on stripe_session_id: the other path won the
    // race and already saved it. Treat as success.
    if (orderError.code === "23505") {
      const { data: now } = await admin
        .from("orders")
        .select("id, customer_name, total")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();
      if (now) {
        return {
          id: now.id,
          name: now.customer_name,
          total: Number(now.total),
          alreadyExisted: true,
        };
      }
    }
    throw new Error(`Could not save order: ${orderError.message}`);
  }

  // Insert the line items. If this fails, roll the order back so we never leave
  // an order with no items (the swallowed-error bug).
  const itemRows = priced.lines.map((l) => ({
    order_id: order.id,
    menu_item_id: l.id,
    name: l.name,
    price: l.price,
    quantity: l.quantity,
  }));
  const { error: itemsError } = await admin.from("order_items").insert(itemRows);
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    throw new Error(`Could not save order items: ${itemsError.message}`);
  }

  return {
    id: order.id,
    name: customerName,
    total: priced.total,
    alreadyExisted: false,
  };
}
