import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before each page loads and keeps the login session fresh.
export async function proxy(request: NextRequest) {
  // If the login service ever falls back to sending someone to the front page with their login
  // code (?code=...), finish the login properly instead of dropping it.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && searchParams.has("code") && !searchParams.has("error")) {
    const target = request.nextUrl.clone();
    target.pathname = "/auth/callback";
    target.search = `?code=${encodeURIComponent(searchParams.get("code") ?? "")}&next=%2F`;
    return NextResponse.redirect(target);
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([header, value]) => response.headers.set(header, value));
      },
    },
  });

  // Refreshes the session if it has expired. Do not remove.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    // Everything except static files and images
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
