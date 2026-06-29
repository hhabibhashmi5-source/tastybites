// Admin "Orders" table with date-range + status filters, paginated at 8 per
// page. Client component so filtering/paging is instant; the status dropdown
// still calls the `updateOrderStatus` Server Action.
"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { updateOrderStatus } from "@/app/admin/actions";
import { ORDER_STATUSES } from "@/lib/order-status";
import { RANGE_OPTIONS } from "@/lib/admin-metrics";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 8;

const STATUS_VARIANT = {
  paid: "secondary",
  preparing: "default",
  out_for_delivery: "default",
  delivered: "outline",
};

const money = (n) => `$${Number(n).toFixed(2)}`;

function cutoffFor(rangeId) {
  const opt = RANGE_OPTIONS.find((r) => r.id === rangeId);
  if (!opt || opt.months == null) return null; // all time
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - (opt.months - 1), 1);
}

export default function OrdersTable({ orders }) {
  const [rangeId, setRangeId] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  // Apply the filters. Resetting to page 1 happens in the change handlers.
  const filtered = useMemo(() => {
    const cutoff = cutoffFor(rangeId);
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (cutoff && new Date(o.created_at) < cutoff) return false;
      return true;
    });
  }, [orders, rangeId, status]);

  const filteredRevenue = useMemo(
    () => filtered.reduce((sum, o) => sum + Number(o.total), 0),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Period</span>
          <select
            value={rangeId}
            onChange={(e) => {
              setRangeId(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All time</option>
            {RANGE_OPTIONS.filter((r) => r.months != null).map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>

        {/* Summary for the current filter */}
        <p className="text-sm text-muted-foreground sm:ml-auto">
          <span className="font-medium text-foreground">{filtered.length}</span> orders ·{" "}
          <span className="font-medium text-foreground">{money(filteredRevenue)}</span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border">
          <p className="p-6 text-sm text-muted-foreground">
            No orders match these filters.
          </p>
        </div>
      ) : (
        <>
          {/* Card list on mobile, table on larger screens */}
          <div className="mt-6 space-y-3 sm:hidden">
            {visible.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{order.customer_name}</p>
                    {order.phone && (
                      <p className="text-xs text-muted-foreground">{order.phone}</p>
                    )}
                  </div>
                  <p className="font-display text-lg text-orange">
                    {money(order.total)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {order.address || "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()}
                </p>
                <form
                  action={updateOrderStatus}
                  className="mt-3 flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={order.id} />
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:border-olive hover:text-olive"
                  >
                    Save
                  </button>
                </form>
              </div>
            ))}
          </div>

          <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-border sm:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Deliver to</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Placed</th>
                  <th className="px-4 py-3 font-medium">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium">
                      {order.customer_name}
                      {order.phone && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {order.phone}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs text-muted-foreground">
                      {order.address || "—"}
                    </td>
                    <td className="px-4 py-3">{money(order.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[order.status] || "outline"}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={updateOrderStatus}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="id" value={order.id} />
                        <select
                          name="status"
                          defaultValue={order.status}
                          className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-olive hover:text-olive"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Showing {start + 1}–{start + visible.length} of {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(current - 1)}
                  disabled={current === 1}
                  aria-label="Previous page"
                  className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-olive hover:text-olive disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      aria-current={n === current ? "page" : undefined}
                      className={
                        n === current
                          ? "h-8 min-w-8 rounded-full bg-orange px-2 text-xs font-semibold text-cream"
                          : "h-8 min-w-8 rounded-full border border-border px-2 text-xs font-medium transition-colors hover:border-olive hover:text-olive"
                      }
                    >
                      {n}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPage(current + 1)}
                  disabled={current === totalPages}
                  aria-label="Next page"
                  className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-olive hover:text-olive disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
