// Next.js 16 Proxy (the renamed `middleware`). Runs on the Node.js runtime.
// Two jobs:
//   1. Refresh the Supabase auth session cookie on every matched request.
//   2. Gate the /admin area — anyone without a session is bounced to login.
// The actual *admin role* check lives in the admin page + server actions
// (defense in depth); see app/admin/.
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() refreshes the session; don't run code between
  // createServerClient and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/admin");
  // The login and signup pages are the only admin URLs reachable while signed out.
  const isPublicAdminPage =
    pathname === "/admin/login" || pathname === "/admin/signup";

  // Not signed in and trying to reach a protected admin page → login.
  if (isAdminArea && !isPublicAdminPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in but sitting on a public admin page → send to dashboard.
  if (isPublicAdminPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on app routes, skipping static assets and image optimization.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
