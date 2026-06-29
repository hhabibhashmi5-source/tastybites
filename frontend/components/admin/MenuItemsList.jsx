// Admin "Menu items" list, paginated at 5 per page. Client component so paging
// is instant (no reload); the Hide/Show and Delete buttons still call the
// `setItemAvailability` / `deleteMenuItem` Server Actions.
"use client";

import { useState } from "react";
import { Star, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { setItemAvailability, deleteMenuItem } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 5;

export default function MenuItemsList({ items }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  // If items shrink (e.g. after a delete) and we're past the last page, clamp.
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = items.slice(start, start + PAGE_SIZE);

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-border">
        <p className="p-6 text-sm text-muted-foreground">
          No items yet — add your first one above.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="divide-y divide-border rounded-2xl border border-border">
        {visible.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-4 p-4">
            {/* Thumbnail — falls back to a placeholder when no photo is set */}
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="h-14 w-14 flex-none rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="grid h-14 w-14 flex-none place-items-center rounded-lg border border-dashed border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                No photo
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{item.name}</p>
                {item.is_featured && (
                  <Star
                    className="h-3.5 w-3.5 fill-mustard text-mustard"
                    strokeWidth={0}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.categories?.name || "Uncategorized"} · $
                {Number(item.price).toFixed(2)}
              </p>
            </div>

            <Badge variant={item.is_available ? "secondary" : "outline"}>
              {item.is_available ? "Available" : "Hidden"}
            </Badge>

            {/* Toggle availability */}
            <form action={setItemAvailability}>
              <input type="hidden" name="id" value={item.id} />
              <input
                type="hidden"
                name="available"
                value={item.is_available ? "false" : "true"}
              />
              <button
                type="submit"
                className="rounded-full border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:border-olive hover:text-olive"
              >
                {item.is_available ? "Hide" : "Show"}
              </button>
            </form>

            {/* Delete */}
            <form action={deleteMenuItem}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                aria-label={`Delete ${item.name}`}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* Pagination controls — only shown when there's more than one page */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {start + 1}–{start + visible.length} of {items.length}
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
    </div>
  );
}
