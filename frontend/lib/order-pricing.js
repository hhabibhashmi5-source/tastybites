// Recomputes an order's price from the DATABASE, never trusting browser prices.
// Used by both the checkout route (to charge) and the confirm route (to verify
// + save), so the two can never disagree.
import { getMenuItems } from "@/lib/menu-data";

const FREE_DELIVERY_THRESHOLD = 20;
const DELIVERY_FEE = 2.99;

// `items` is what the browser sends: [{ id, quantity }, ...] (extra fields ignored).
export async function priceOrder(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const menu = await getMenuItems();
  const byId = new Map(menu.map((m) => [m.id, m]));

  const lines = items.map((entry) => {
    const item = byId.get(entry.id);
    if (!item) throw new Error(`Unknown item: ${entry.id}`);

    const quantity = Number(entry.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(`Invalid quantity for ${entry.id}`);
    }
    return { id: item.id, name: item.name, price: item.price, quantity };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  // Exact integer cents, computed the same way Stripe sums line items — used to
  // verify the amount actually paid matches what we expect.
  const amountCents =
    lines.reduce((sum, l) => sum + Math.round(l.price * 100) * l.quantity, 0) +
    Math.round(delivery * 100);

  return {
    lines,
    subtotal: Math.round(subtotal * 100) / 100,
    delivery: Math.round(delivery * 100) / 100,
    total: Math.round(total * 100) / 100,
    amountCents,
  };
}
