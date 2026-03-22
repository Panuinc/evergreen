import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request: import("next/server").NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(svg|png|jpg|jpeg|gif|webp|css|js)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // getSession() reads from cookie (no network call) — JWT is verified by Go API on every request
    const { data: { session } } = await supabase.auth.getSession();
    const isAuthenticated = !!session;
    const isAuthPage = pathname.startsWith("/auth");
    const isPublicPage = pathname.startsWith("/quotation");

    if (isAuthenticated && (pathname === "/" || isAuthPage)) {
      return NextResponse.redirect(new URL("/overview/dashboard", request.url));
    }

    if (!isAuthenticated && !isAuthPage && !isPublicPage) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

  } catch (error) {
    console.error("Proxy error:", error);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
