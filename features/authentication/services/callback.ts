import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteOrigin, safeNextPath } from "../lib/redirects";
import { tokenHashSchema } from "../lib/validation";
import { clearPendingSignup } from "../lib/pending-signup";
import { authenticatedDestination } from "./session";

const OAUTH_INTENT_COOKIE = "agromind_oauth_intent";

function securedRedirect(destination: URL, clearOauthIntent = false) {
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  if (clearOauthIntent) {
    response.cookies.set(OAUTH_INTENT_COOKIE, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}

function oauthCallbackOrigin(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const host = request.nextUrl.hostname.toLowerCase();
  const productionHost =
    host === "agromind.ir" || host === "www.agromind.ir";
  const previewHost =
    process.env.VERCEL_ENV === "preview" &&
    /^agro-mind(?:-git)?-[a-z0-9-]+-ali-mafi\.vercel\.app$/.test(host);

  if (request.nextUrl.protocol !== "https:" || (!productionHost && !previewHost))
    return siteOrigin();

  return origin;
}

function oauthIntent(request: NextRequest) {
  const raw = request.cookies.get(OAUTH_INTENT_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as {
      next?: unknown;
      source?: unknown;
    };
    return {
      next: safeNextPath(
        typeof parsed.next === "string" ? parsed.next : null,
      ),
      source: parsed.source === "signup" ? "signup" : "login",
    } as const;
  } catch {
    return null;
  }
}

function oauthFailureDestination(
  request: NextRequest,
  intent: ReturnType<typeof oauthIntent>,
) {
  const source = intent?.source === "signup" ? "/sign-up" : "/sign-in";
  const destination = new URL(source, oauthCallbackOrigin(request));
  destination.searchParams.set("status", "oauth-error");
  const next = intent?.next ?? "/dashboard";
  if (next !== "/dashboard") destination.searchParams.set("next", next);
  return destination;
}

async function handleOAuthCallback(
  request: NextRequest,
  params: URLSearchParams,
) {
  const intent = oauthIntent(request);
  const failure = oauthFailureDestination(request, intent);
  const code = params.get("code");
  if (!code) return securedRedirect(failure, true);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return securedRedirect(failure, true);

    await clearPendingSignup();
    const destination = await authenticatedDestination(intent?.next);
    if (!destination) {
      await supabase.auth.signOut({ scope: "local" });
      return securedRedirect(failure, true);
    }

    return securedRedirect(
      new URL(destination, oauthCallbackOrigin(request)),
      true,
    );
  } catch {
    return securedRedirect(failure, true);
  }
}

export async function handleAuthCallback(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (
    request.cookies.has(OAUTH_INTENT_COOKIE) ||
    params.get("flow") === "oauth"
  ) {
    return handleOAuthCallback(request, params);
  }

  const recovery =
    params.get("type") === "recovery" ||
    params.get("next") === "/reset-password";
  const destination = new URL(
    recovery ? "/reset-password" : "/verify-email",
    siteOrigin(),
  );

  // Do not consume token-hash email links on GET: security scanners often prefetch links.
  const hash = tokenHashSchema.safeParse(params.get("token_hash"));
  if (
    hash.success &&
    ["signup", "recovery"].includes(params.get("type") ?? "")
  ) {
    destination.searchParams.set("token_hash", hash.data);
  } else if (params.get("code")) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(
      params.get("code")!,
    );
    if (error) destination.searchParams.set("status", "invalid");
    else if (!recovery) {
      await supabase.auth.signOut({ scope: "local" });
      destination.searchParams.set("status", "success");
    }
  } else destination.searchParams.set("status", "invalid");

  return securedRedirect(destination);
}
