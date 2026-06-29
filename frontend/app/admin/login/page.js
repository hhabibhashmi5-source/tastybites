// Admin login page (/admin/login). The proxy already redirects signed-in admins
// straight to /admin, so this is only shown to logged-out visitors.
import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Admin sign in — TastyBites" };

export default async function AdminLoginPage({ searchParams }) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto max-w-sm px-5 py-24">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
        Staff only
      </p>
      <h1 className="font-display text-4xl">Admin sign in</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Manage the menu and view incoming orders.
      </p>

      <LoginForm next={typeof next === "string" ? next : "/admin"} />
    </main>
  );
}
