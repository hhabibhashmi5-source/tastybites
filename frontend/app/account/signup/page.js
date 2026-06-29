// Customer sign-up page (/account/signup). Reachable while signed out; an
// already-signed-in user is sent to their account.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomerSignupForm from "@/components/account/CustomerSignupForm";

export const metadata = { title: "Create account — TastyBites" };

export default async function AccountSignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/account");

  return (
    <main className="mx-auto max-w-sm px-5 py-24">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
        Get started
      </p>
      <h1 className="font-display text-4xl">Create your account</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Save your delivery details and keep track of every order.
      </p>

      <CustomerSignupForm />
    </main>
  );
}
