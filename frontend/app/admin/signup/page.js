// Account sign-up page (/admin/signup). Reachable while signed out; the proxy
// sends already-signed-in users to the dashboard.
import SignupForm from "@/components/admin/SignupForm";

export const metadata = { title: "Create account — TastyBites" };

export default function AdminSignupPage() {
  return (
    <main className="mx-auto max-w-sm px-5 py-24">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
        Get started
      </p>
      <h1 className="font-display text-4xl">Create account</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        New accounts start as customers — an existing admin grants admin access.
      </p>

      <SignupForm />
    </main>
  );
}
