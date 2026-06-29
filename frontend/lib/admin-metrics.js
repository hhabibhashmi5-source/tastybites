// Pure business-analytics helpers for the admin dashboard. No Supabase, no React
// here — just turn the rows we already fetched into the numbers an owner cares
// about (revenue, order counts, monthly trend, status mix, best sellers), for a
// chosen time window (this month / 3 / 6 / 12 months / all time).
//
// `orders`     : [{ total, status, created_at }, ...]
// `orderItems` : [{ name, quantity, price, orders: { created_at } }, ...]
// `opts.now`        : a Date (passed in so this stays a pure function).
// `opts.rangeMonths`: number of months to include, or null for "all time".

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// The time windows the owner can pick from. `months: null` means "all time".
export const RANGE_OPTIONS = [
  { id: "1m", label: "This month", months: 1 },
  { id: "3m", label: "Last 3 months", months: 3 },
  { id: "6m", label: "Last 6 months", months: 6 },
  { id: "12m", label: "Last 12 months", months: 12 },
  { id: "all", label: "All time", months: null },
];

export const DEFAULT_RANGE = "6m";

export function rangeOption(id) {
  return RANGE_OPTIONS.find((r) => r.id === id) || RANGE_OPTIONS.find((r) => r.id === DEFAULT_RANGE);
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function computeMetrics(orders = [], orderItems = [], opts = {}) {
  const now = opts.now || new Date();
  const rangeMonths = opts.rangeMonths === undefined ? 6 : opts.rangeMonths;

  const today = startOfDay(now);
  // Cutoff = first day of the month that opens the window (null = all time).
  const cutoff = rangeMonths
    ? new Date(now.getFullYear(), now.getMonth() - (rangeMonths - 1), 1)
    : null;
  const inRange = (d) => !cutoff || d >= cutoff;

  // How many monthly bars to draw. For "all time" show the last 12 months.
  const chartCount = rangeMonths ? Math.min(rangeMonths, 12) : 12;

  let periodRevenue = 0;
  let periodOrders = 0;
  let totalRevenueAllTime = 0;
  let ordersToday = 0;
  let inProgress = 0;

  const statusCounts = {
    paid: 0,
    preparing: 0,
    out_for_delivery: 0,
    delivered: 0,
  };

  // Monthly buckets, oldest → newest, keyed by "YYYY-M".
  const months = [];
  const monthIndex = new Map();
  for (let i = chartCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = {
      key,
      label: MONTH_LABELS[d.getMonth()],
      year: d.getFullYear(),
      revenue: 0,
      orders: 0,
    };
    monthIndex.set(key, bucket);
    months.push(bucket);
  }

  for (const o of orders) {
    const total = Number(o.total) || 0;
    const placed = new Date(o.created_at);

    totalRevenueAllTime += total;
    // Operational metrics are always "live" (not window-bound).
    if (placed >= today) ordersToday += 1;
    if (o.status !== "delivered") inProgress += 1;

    if (!inRange(placed)) continue;

    periodRevenue += total;
    periodOrders += 1;
    if (o.status in statusCounts) statusCounts[o.status] += 1;

    const key = `${placed.getFullYear()}-${placed.getMonth()}`;
    const bucket = monthIndex.get(key);
    if (bucket) {
      bucket.revenue += total;
      bucket.orders += 1;
    }
  }

  const avgOrderValue = periodOrders ? periodRevenue / periodOrders : 0;

  // Best sellers within the window: fold order_items by name.
  const byName = new Map();
  for (const it of orderItems) {
    const placed = it.orders?.created_at ? new Date(it.orders.created_at) : null;
    if (placed && !inRange(placed)) continue;

    const name = it.name || "Unknown";
    const qty = Number(it.quantity) || 0;
    const line = qty * (Number(it.price) || 0);
    const row = byName.get(name) || { name, qty: 0, revenue: 0 };
    row.qty += qty;
    row.revenue += line;
    byName.set(name, row);
  }
  const topItems = [...byName.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    rangeMonths,
    periodRevenue,
    periodOrders,
    avgOrderValue,
    totalRevenueAllTime,
    totalOrdersAllTime: orders.length,
    ordersToday,
    inProgress,
    statusCounts,
    months,
    topItems,
  };
}
