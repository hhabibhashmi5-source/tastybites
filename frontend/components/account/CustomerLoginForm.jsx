// Customer login form. Calls the `customerSignIn` Server Action; on success the
// action redirects (to `next`, default /account), so there's no success state
// to handle here. Mirrors components/admin/LoginForm but is the PUBLIC door —
// it never rejects non-admins.
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { customerSignIn } from "@/app/account/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CustomerLoginForm({ next = "/account" }) {
  const [state, action, pending] = useActionState(customerSignIn, null);

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-orange py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22] disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/account/signup" className="text-olive hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
