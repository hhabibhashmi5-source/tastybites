// Time-window switcher for the Overview analytics. Writes the choice to the URL
// (?range=6m) so the server re-computes the metrics for that window. Kept in the
// URL (not local state) so a refresh / shared link keeps the same view.
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { RANGE_OPTIONS } from "@/lib/admin-metrics";

export default function RangeFilter({ active }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(id) {
    const params = new URLSearchParams(searchParams);
    params.set("range", id);
    // scroll:false keeps the owner where they are on the page.
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {RANGE_OPTIONS.map((opt) => {
        const isActive = opt.id === active;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => select(opt.id)}
            aria-current={isActive ? "true" : undefined}
            className={
              isActive
                ? "rounded-full bg-orange px-3.5 py-1.5 text-xs font-semibold text-cream"
                : "rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-olive hover:text-olive"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
