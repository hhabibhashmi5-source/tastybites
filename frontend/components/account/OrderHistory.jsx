// Read-only list of the signed-in customer's past orders, newest first.
// Presentational only (no hooks) so it renders inside the /account Server
// Component. Status pills use the shared ORDER_STATUS_META badge classes.
import { ORDER_STATUS_META, statusLabel } from "@/lib/order-status";

const money = (n) => `$${Number(n).toFixed(2)}`;

export default function OrderHistory({ orders }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You haven&apos;t placed any orders yet. When you order while signed in,
        they&apos;ll show up here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const meta = ORDER_STATUS_META[order.status];
        const items = order.order_items ?? [];
        return (
          <article
            key={order.id}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    meta?.badge ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {statusLabel(order.status)}
                </span>
                <time className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()}
                </time>
              </div>
              <p className="font-display text-lg text-orange">
                {money(order.total)}
              </p>
            </div>

            {items.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {items.map((line, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">
                      {line.quantity}× {line.name}
                    </span>
                    <span className="flex-none">
                      {money(line.price * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}
