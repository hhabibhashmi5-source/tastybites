// Lets the signed-in admin change their own account password.
"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  const formRef = useRef(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Password updated");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="grid grid-cols-1 gap-4 sm:max-w-md"
    >
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Re-enter the password"
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
        className="flex items-center justify-center gap-2 rounded-full bg-orange px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22] disabled:opacity-70 sm:w-fit"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Updating…
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4" /> Update password
          </>
        )}
      </button>
    </form>
  );
}
