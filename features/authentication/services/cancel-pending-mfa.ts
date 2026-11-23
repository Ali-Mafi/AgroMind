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
import {
  DEFAULT_PREFERENCES,
  resolvePreferences,
} from "@/features/settings/lib/preferences";
import {
  PREFERENCES_COOKIE,
  preferencesFromCookie,
} from "@/features/settings/lib/preferences-cookie";
import { translator } from "@/features/settings/lib/translation";

export async function cancelPendingMfa(request: NextRequest) {
  const headers = {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
  };
  const rejected = (status: number) => {
    const preferences = preferencesFromCookie(
      request.cookies.get(PREFERENCES_COOKIE)?.value,
    );
    const { language } = resolvePreferences(preferences ?? DEFAULT_PREFERENCES);
    return new NextResponse(
      translator(language)("Could not cancel. Please try again."),
      { status, headers: { ...headers, "Content-Language": language } },
    );
  };
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const origin = request.headers.get("origin");
  const source = origin && URL.canParse(origin) ? new URL(origin) : null;
  if (!source || source.origin !== origin || source.host !== host)
    return rejected(403);

  const response =
    request.headers.get("accept") === "application/json"
      ? new NextResponse(null, { status: 204, headers })
      : new NextResponse(null, {
          status: 303,
          headers: { ...headers, Location: "/sign-in" },
        });
  if (!isSupabaseConfigured()) return response;

  // This endpoint accepts only the small native form rendered on /mfa.
  const type = request.headers.get("content-type")?.split(";")[0];
  if (
    type !== "application/x-www-form-urlencoded" ||
    Number(request.headers.get("content-length")) > 256
  ) {
    return rejected(400);
  }

  const body = await request.text();
  if (!body || body.length > 256)
    return rejected(400);
  const form = new URLSearchParams(body);
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
