// Client tabs for the menu page — receives categories + items as props.
// Each category paginates its items, 5 per page.
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MenuCard from "@/components/MenuCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PER_PAGE = 5;

// One category's items, broken into pages of PER_PAGE with page controls.
function PaginatedItems({ items }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  // Clamp in case the list shrank (e.g. an item was hidden) below the page.
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PER_PAGE;
  const visible = items.slice(start, start + PER_PAGE);

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nothing here yet — check back soon.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            aria-label="Previous page"
            className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:border-olive hover:text-olive disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              aria-current={n === current ? "page" : undefined}
              className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                n === current
                  ? "bg-orange text-cream"
                  : "border border-border hover:border-olive hover:text-olive"
              }`}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current === totalPages}
            aria-label="Next page"
            className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:border-olive hover:text-olive disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function MenuTabs({ categories, items }) {
  return (
    <Tabs defaultValue={categories[0]} className="mt-10">
      <TabsList className="mb-8 flex w-full max-w-full justify-start overflow-x-auto bg-secondary">
        {categories.map((category) => (
          <TabsTrigger
            key={category}
            value={category}
            className="flex-none whitespace-nowrap uppercase tracking-[0.12em] data-[state=active]:text-olive"
          >
            {category}
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((category) => {
        const inCategory = items.filter((i) => i.category === category);
        return (
          <TabsContent key={category} value={category}>
            <PaginatedItems items={inCategory} />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
