import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  sessionCookieOptions,
  supabaseConfig,
} from "@/lib/supabase/config";
import {
  isPrivatePath,
  safeNextPath,
} from "@/features/authentication/lib/redirects";
import {
  sessionCookieName,
  visibleSessionCookies,
} from "@/lib/supabase/session-cookies";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const secureResponse = (next: NextResponse) => {
    response.cookies.getAll().forEach((cookie) => next.cookies.set(cookie));
    next.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
    next.headers.set("Pragma", "no-cache");
    next.headers.set("Expires", "0");
    // A native form POST needs an Origin header for its same-origin check.
    next.headers.set(
      "Referrer-Policy",
      request.nextUrl.pathname === "/mfa" ? "same-origin" : "no-referrer",
    );
    return next;
  };
  const signIn = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("next", safeNextPath(request.nextUrl.pathname));
    return secureResponse(NextResponse.redirect(url));
  };
  if (!isSupabaseConfigured())
    return isPrivatePath(request.nextUrl.pathname)
      ? signIn()
      : secureResponse(response);
  const { url, key } = supabaseConfig();
  const sessionName = sessionCookieName(url);
  const supabase = createServerClient<Database>(url, key, {
    cookieOptions: { ...sessionCookieOptions, name: sessionName },
    cookies: {
      getAll: () => visibleSessionCookies(request.cookies.getAll(), sessionName),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            ...options,
            ...sessionCookieOptions,
          }),
        );
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });
  const { data, error } = await supabase.auth.getClaims();
  if (isPrivatePath(request.nextUrl.pathname) && (error || !data?.claims.sub))
    return signIn();
  return secureResponse(response);
}
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assistant/:path*",
    "/farms/:path*",
    "/irrigation/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/weather/:path*",
    "/onboarding/:path*",
    "/accept-terms",
    "/sign-in",
    "/sign-up",
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/mfa",
    "/auth/:path*",
  ],
};
