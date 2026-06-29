// The admin "frame": a sticky section switcher so the dashboard is organised
// into clear areas (Overview / Menu / Orders / Messages / Reviews / Account)
// instead of one endless scroll. Each section's content is server-rendered and
// passed in as a node — this component only decides which one is visible.
"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  MessageSquare,
  Star,
  Settings,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "menu", label: "Menu", icon: UtensilsCrossed, countKey: "menu" },
  { id: "orders", label: "Orders", icon: ShoppingBag, countKey: "orders" },
  { id: "messages", label: "Messages", icon: MessageSquare, countKey: "messages" },
  { id: "reviews", label: "Reviews", icon: Star, countKey: "reviews" },
  { id: "account", label: "Account", icon: Settings },
];

export default function AdminShell({ sections, counts = {} }) {
  const [active, setActive] = useState("overview");

  return (
    <div className="mt-8">
      {/* Sticky section nav — scrolls horizontally on small screens */}
      <nav className="sticky top-20 z-30 -mx-5 mb-8 border-b border-border bg-background/85 px-5 backdrop-blur sm:top-24">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon, countKey }) => {
            const isActive = active === id;
            const count = countKey ? counts[countKey] : undefined;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-none items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-orange text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {typeof count === "number" && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive ? "bg-orange/15 text-orange" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active section */}
      <div>{sections[active]}</div>
    </div>
  );
}
