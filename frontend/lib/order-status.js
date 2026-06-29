// Order lifecycle stages, in order. Shared by the admin UI (to build the status
// dropdown) and the status-update Server Action (to validate writes).
// Lives here, not in app/admin/actions.js, because a "use server" file may only
// export async functions — exporting this array from there is a runtime error.
export const ORDER_STATUSES = [
  "paid",
  "preparing",
  "out_for_delivery",
  "delivered",
];

// Human labels + a Tailwind badge class for each status (used by the dashboard).
export const ORDER_STATUS_META = {
  paid: { label: "Paid", badge: "bg-amber-100 text-amber-800" },
  preparing: { label: "Preparing", badge: "bg-blue-100 text-blue-800" },
  out_for_delivery: {
    label: "Out for delivery",
    badge: "bg-purple-100 text-purple-800",
  },
  delivered: { label: "Delivered", badge: "bg-green-100 text-green-800" },
};

export function statusLabel(status) {
  return ORDER_STATUS_META[status]?.label ?? status;
}
