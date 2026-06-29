// Business "Overview" — the at-a-glance answer to "how is the shop doing?" over
// a chosen time window. Server-rendered; it only displays the numbers that
// lib/admin-metrics.js already computed. The window switcher (RangeFilter) is
// the one interactive piece.
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  Wallet,
  Trophy,
} from "lucide-react";
import { ORDER_STATUS_META, ORDER_STATUSES } from "@/lib/order-status";
import { rangeOption } from "@/lib/admin-metrics";
import RangeFilter from "@/components/admin/RangeFilter";

const money = (n) =>
  `$${Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function OverviewSection({ metrics, recentOrders = [], rangeId }) {
  const {
    periodRevenue,
    periodOrders,
    avgOrderValue,
    totalRevenueAllTime,
    ordersToday,
    inProgress,
    statusCounts,
    months,
    topItems,
  } = metrics;

  const range = rangeOption(rangeId);
  const rangeLabel = range.label.toLowerCase();

  const cards = [
    { icon: DollarSign, label: "Revenue", value: money(periodRevenue), sub: rangeLabel },
    { icon: ShoppingBag, label: "Orders", value: periodOrders, sub: `${ordersToday} today` },
    { icon: TrendingUp, label: "Avg order", value: money(avgOrderValue), sub: "per order" },
    { icon: Clock, label: "In progress", value: inProgress, sub: "not delivered yet" },
    { icon: Wallet, label: "All-time revenue", value: money(totalRevenueAllTime), sub: "since launch" },
  ];

  // Tallest bar = 100%; everything scales against the busiest month.
  const maxRevenue = Math.max(1, ...months.map((m) => m.revenue));

  return (
    <div className="space-y-8">
      {/* Window switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Business overview</h2>
          <p className="text-sm text-muted-foreground">
            Showing data for: <span className="font-medium text-foreground">{range.label}</span>
          </p>
        </div>
        <RangeFilter active={range.id} />
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </span>
              <Icon className="h-4 w-4 text-olive" />
            </div>
            <p className="mt-3 font-display text-2xl sm:text-3xl">{value}</p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">{sub}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg">Revenue trend</h3>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              tap a bar for detail
            </span>
          </div>

          {periodOrders === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">
              No orders in this window — pick a wider range or wait for orders to come in.
            </p>
          ) : (
            <div className="mt-6 flex h-44 items-end justify-between gap-2 sm:gap-3">
              {months.map((m) => {
                const pct = Math.round((m.revenue / maxRevenue) * 100);
                return (
                  <div
                    key={m.key}
                    className="group flex flex-1 flex-col items-center justify-end gap-2"
                    title={`${m.label} ${m.year}: ${money(m.revenue)} · ${m.orders} orders`}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {money(m.revenue)}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-orange/85 transition-colors group-hover:bg-orange"
                      style={{ height: `${Math.max(pct, m.revenue > 0 ? 4 : 0)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground sm:text-xs">{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Order status mix */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg">Orders by status</h3>
          <ul className="mt-5 space-y-3">
            {ORDER_STATUSES.map((s) => {
              const count = statusCounts[s] || 0;
              const pct = periodOrders ? Math.round((count / periodOrders) * 100) : 0;
              return (
                <li key={s}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{ORDER_STATUS_META[s]?.label ?? s}</span>
                    <span className="text-muted-foreground">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-olive" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Best sellers */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <Trophy className="h-4 w-4 text-mustard" /> Best sellers
          </h3>
          {topItems.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">No sales in this window.</p>
          ) : (
            <ol className="mt-5 space-y-3">
              {topItems.map((it, i) => (
                <li key={it.name} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{it.name}</span>
                  <span className="text-xs text-muted-foreground">{it.qty} sold</span>
                  <span className="w-20 text-right font-display text-sm text-orange">
                    {money(it.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Latest orders snapshot */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg">Latest orders</h3>
          {recentOrders.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{o.customer_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()}
                  </span>
                  <span className="w-20 text-right font-display text-orange">
                    {money(o.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
