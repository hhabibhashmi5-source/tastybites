// Customer sign-in page (/account/login). Reachable while signed out; if an
// already-signed-in user lands here we send them to their account. (Gating lives
// at the page level for /account/* — proxy.js only guards /admin.)
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomerLoginForm from "@/components/account/CustomerLoginForm";

export const metadata = { title: "Sign in — TastyBites" };

export default async function AccountLoginPage({ searchParams }) {
  const { next } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/account");

  // Only ever forward to an internal path after sign-in.
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/account";

  return (
    <main className="mx-auto max-w-sm px-5 py-24">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
        Welcome back
      </p>
      <h1 className="font-display text-4xl">Sign in</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        See your order history and save your details for faster checkout.
      </p>

      <CustomerLoginForm next={safeNext} />
    </main>
  );
}
