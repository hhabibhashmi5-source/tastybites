// Lets the signed-in customer edit their own profile (name, phone, default
// delivery address). Calls the `updateProfile` Server Action, which is RLS-gated
// to the caller's own row. Pre-filled from the current profile.
"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/app/account/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfileForm({ profile }) {
  const [state, action, pending] = useActionState(updateProfile, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Profile saved");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile?.full_name ?? ""}
          autoComplete="name"
          placeholder="Your name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile?.phone ?? ""}
          autoComplete="tel"
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="default_address">Default delivery address</Label>
        <Input
          id="default_address"
          name="default_address"
          defaultValue={profile?.default_address ?? ""}
          autoComplete="street-address"
          placeholder="123 Main St, Springfield"
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
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" /> Save profile
          </>
        )}
      </button>
    </form>
  );
}
