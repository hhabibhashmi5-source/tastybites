// Admin dashboard (/admin). Server Component.
// Security: the proxy already blocks anonymous users, but we re-verify the
// admin role here (close to the data) — never trust the proxy alone.
import { redirect } from "next/navigation";
import { LogOut, Star, Trash2, Reply } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { computeMetrics, rangeOption } from "@/lib/admin-metrics";
import {
  setReviewApproval,
  deleteReview,
  signOut,
} from "@/app/admin/actions";
import AddItemForm from "@/components/admin/AddItemForm";
import MenuItemsList from "@/components/admin/MenuItemsList";
import OrdersTable from "@/components/admin/OrdersTable";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";
import AdminShell from "@/components/admin/AdminShell";
import OverviewSection from "@/components/admin/OverviewSection";
import { Badge } from "@/components/ui/badge";

// Always render fresh, per-request (this page is per-admin and shows live data).
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
  // The selected analytics window (?range=6m). Defaults to 6 months.
  const params = await searchParams;
  const range = rangeOption(params?.range);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  // Signed in but not an admin → send home (not back to login, which would
  // bounce against the proxy's "logged-in → /admin" rule and loop).
  if (profile?.role !== "admin") redirect("/");

  const [
    { data: categories },
    { data: items },
    { data: orders },
    { data: messages },
    { data: reviews },
    { data: orderItems },
  ] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase
      .from("menu_items")
      .select("id, name, price, image_url, is_available, is_featured, categories(name)")
      .order("created_at", { ascending: false }),
    // All orders — analytics needs the full history, not just the last page.
    supabase
      .from("orders")
      .select("id, customer_name, phone, address, total, status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_messages")
      .select("id, name, email, message, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("reviews")
      .select("id, name, rating, comment, is_approved, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    // Line items power the "best sellers" ranking. Embed each line's parent
    // order date so best-sellers can be filtered to the selected window.
    supabase.from("order_items").select("name, quantity, price, orders(created_at)"),
  ]);

  const menuItems = items ?? [];
  const orderRows = orders ?? [];
  const contactMessages = messages ?? [];
  const reviewRows = reviews ?? [];

  const metrics = computeMetrics(orderRows, orderItems ?? [], {
    now: new Date(),
    rangeMonths: range.months,
  });

  // ---------- Section: Menu ----------
  const menuSection = (
    <div className="space-y-12">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-display text-2xl">Add a menu item</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          New items appear on the live menu within a minute.
        </p>
        <div className="mt-6">
          <AddItemForm categories={categories ?? []} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">
          Menu items{" "}
          <span className="text-muted-foreground">({menuItems.length})</span>
        </h2>
        <MenuItemsList items={menuItems} />
      </section>
    </div>
  );

  // ---------- Section: Messages ----------
  const messagesSection = (
    <div className="space-y-4">
      {contactMessages.length === 0 ? (
        <p className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">
          No messages yet.
        </p>
      ) : (
        contactMessages.map((msg) => {
          const replyHref =
            `mailto:${msg.email}` +
            `?subject=${encodeURIComponent("Re: your message to TastyBites")}` +
            `&body=${encodeURIComponent(
              `Hi ${msg.name},\n\n\n\n— — —\nOn ${new Date(
                msg.created_at
              ).toLocaleString()} you wrote:\n` +
                msg.message
                  .split("\n")
                  .map((line) => `> ${line}`)
                  .join("\n")
            )}`;

          return (
            <article
              key={msg.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="font-medium">{msg.name}</p>
                <a
                  href={`mailto:${msg.email}`}
                  className="text-sm text-olive hover:underline"
                >
                  {msg.email}
                </a>
                <time className="ml-auto text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString()}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {msg.message}
              </p>
              <div className="mt-4 flex justify-end">
                <a
                  href={replyHref}
                  className="inline-flex items-center gap-2 rounded-full bg-orange px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22]"
                >
                  <Reply className="h-4 w-4" /> Reply
                </a>
              </div>
            </article>
          );
        })
      )}
    </div>
  );

  // ---------- Section: Reviews ----------
  const reviewsSection = (
    <div>
      <p className="text-sm text-muted-foreground">
        Approve the ones you want shown in the “Don&apos;t take our word for it”
        section on the home page.
      </p>
      <div className="mt-6 space-y-4">
        {reviewRows.length === 0 ? (
          <p className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">
            No reviews yet.
          </p>
        ) : (
          reviewRows.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="font-medium">{review.name}</p>
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={
                        s < review.rating
                          ? "h-3.5 w-3.5 fill-mustard text-mustard"
                          : "h-3.5 w-3.5 text-muted-foreground/30"
                      }
                      strokeWidth={s < review.rating ? 0 : 1.5}
                    />
                  ))}
                </span>
                <Badge variant={review.is_approved ? "secondary" : "outline"}>
                  {review.is_approved ? "On home page" : "Pending"}
                </Badge>
                <time className="ml-auto text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </time>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                “{review.comment}”
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <form action={setReviewApproval}>
                  <input type="hidden" name="id" value={review.id} />
                  <input
                    type="hidden"
                    name="approved"
                    value={review.is_approved ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:border-olive hover:text-olive"
                  >
                    {review.is_approved ? "Remove from home" : "Approve"}
                  </button>
                </form>

                <form action={deleteReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <button
                    type="submit"
                    aria-label={`Delete review by ${review.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );

  // ---------- Section: Account ----------
  const accountSection = (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="font-display text-2xl">Account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Set a new password for your admin account.
      </p>
      <div className="mt-6">
        <ChangePasswordForm />
      </div>
    </section>
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
            Dashboard
          </p>
          <h1 className="font-display text-4xl sm:text-5xl">
            Welcome, {profile.full_name || "admin"}
          </h1>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>

      <AdminShell
        counts={{
          menu: menuItems.length,
          orders: orderRows.length,
          messages: contactMessages.length,
          reviews: reviewRows.length,
        }}
        sections={{
          overview: (
            <OverviewSection
              metrics={metrics}
              recentOrders={orderRows.slice(0, 5)}
              rangeId={range.id}
            />
          ),
          menu: menuSection,
          orders: <OrdersTable orders={orderRows} />,
          messages: messagesSection,
          reviews: reviewsSection,
          account: accountSection,
        }}
      />
    </main>
  );
}
