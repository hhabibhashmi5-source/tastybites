// Customer account dashboard (/account). Server Component.
// Shows the signed-in customer's profile (editable) and their order history.
// Anonymous visitors are bounced to sign-in. Order rows are scoped to the user
// automatically by RLS (orders_select_own), so we don't filter by id here.
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { customerSignOut } from "@/app/account/actions";
import ProfileForm from "@/components/account/ProfileForm";
import OrderHistory from "@/components/account/OrderHistory";

export const metadata = { title: "Your account — TastyBites" };

// Per-user, live data — always render fresh.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/account");

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, default_address")
      .eq("id", user.id)
      .single(),
    supabase
      .from("orders")
      .select("id, total, status, created_at, order_items(name, price, quantity)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
            Your account
          </p>
          <h1 className="font-display text-4xl sm:text-5xl">
            Hi, {profile?.full_name || "there"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={customerSignOut}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Your details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll use these to speed up checkout.
        </p>
        <div className="mt-6">
          <ProfileForm profile={profile} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Order history</h2>
        <div className="mt-6">
          <OrderHistory orders={orders ?? []} />
        </div>
      </section>
    </main>
  );
}
