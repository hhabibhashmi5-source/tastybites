// Admin login form. Calls the `signIn` Server Action; on success the action
// redirects to the dashboard, so there's no success state to handle here.
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signIn } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm({ next = "/admin" }) {
  const [state, action, pending] = useActionState(signIn, null);

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
        Don&apos;t have an account?{" "}
        <Link href="/admin/signup" className="text-olive hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
