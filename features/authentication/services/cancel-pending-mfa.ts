import { DEFAULT_COOKIE_OPTIONS } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  sessionCookieOptions,
  supabaseConfig,
} from "@/lib/supabase/config";
import {
  pendingMfaCancellationCookie,
  sessionCookieName,
} from "@/lib/supabase/session-cookies";

export async function cancelPendingMfa(request: NextRequest) {
  const headers = {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
  };
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const origin = request.headers.get("origin");
  const source = origin && URL.parse(origin);
  if (!source || source.origin !== origin || source.host !== host)
    return new NextResponse(null, { status: 403, headers });

  const response = new NextResponse(null, {
    status: 303,
    headers: { ...headers, Location: "/sign-in" },
  });
  if (!isSupabaseConfigured()) return response;

  // This endpoint accepts only the small native form rendered on /mfa.
  const length = Number(request.headers.get("content-length"));
  if (
    request.headers.get("content-type") !== "application/x-www-form-urlencoded" ||
    !Number.isInteger(length) || length < 1 || length > 256
  ) {
    return new NextResponse(null, { status: 400, headers });
  }

  const form = new URLSearchParams(await request.text());
  const { url } = supabaseConfig();
  const cancellation = await pendingMfaCancellationCookie(
    request.cookies.getAll(),
    sessionCookieName(url),
  );
  if (
    cancellation &&
    form.get("attempt") === cancellation &&
    request.cookies.get(cancellation)?.value !== "1"
  ) {
    // A late response writes only this marker. It cannot overwrite auth cookies
    // from another sign-in or an AAL2 upgrade of the same provider session.
    response.cookies.set(cancellation, "1", {
      ...sessionCookieOptions,
      maxAge: DEFAULT_COOKIE_OPTIONS.maxAge,
    });
  }
  return response;
}
