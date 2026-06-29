// A status dropdown for one order. Submits the `updateOrderStatus` Server Action
// the moment a new status is picked — no separate "save" button needed.
"use client";

import { useRef } from "react";
import { updateOrderStatus } from "@/app/admin/actions";

const STATUSES = [
  ["paid", "Paid"],
  ["preparing", "Preparing"],
  ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"],
];

export default function OrderStatusSelect({ id, status }) {
  const formRef = useRef(null);

  return (
    <form ref={formRef} action={updateOrderStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {STATUSES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
}
