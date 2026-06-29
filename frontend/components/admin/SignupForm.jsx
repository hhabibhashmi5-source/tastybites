// Account sign-up form. Calls the `signUp` Server Action. New accounts are
// regular customers; admin access is granted separately.
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signUp } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupForm() {
  const [state, action, pending] = useActionState(signUp, null);

  // Success screen — account created.
  if (state?.ok) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <p className="font-medium text-olive">Account created 🎉</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {state.needsConfirm
            ? "Check your email and click the confirmation link, then sign in."
            : "You can now sign in with your email and password."}
        </p>
        <Link
          href="/admin/login"
          className="mt-4 inline-block rounded-full bg-orange px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22]"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" placeholder="Your name" />
      </div>

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
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
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
            <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
          </>
        ) : (
          "Create account"
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/admin/login" className="text-olive hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
