import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteOrigin, safeNextPath } from "../lib/redirects";
import { tokenHashSchema } from "../lib/validation";
import { clearPendingSignup } from "../lib/pending-signup";
import { authenticatedDestination } from "./session";

function securedRedirect(destination: URL) {
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function oauthFailureDestination(params: URLSearchParams) {
  const source = params.get("source") === "signup" ? "/sign-up" : "/sign-in";
  const destination = new URL(source, siteOrigin());
  destination.searchParams.set("status", "oauth-error");
  const next = safeNextPath(params.get("next"));
  if (next !== "/dashboard") destination.searchParams.set("next", next);
  return destination;
}

async function handleOAuthCallback(params: URLSearchParams) {
  const failure = oauthFailureDestination(params);
  const code = params.get("code");
  if (!code) return securedRedirect(failure);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return securedRedirect(failure);

    await clearPendingSignup();
    const destination = await authenticatedDestination(params.get("next"));
    if (!destination) {
      await supabase.auth.signOut({ scope: "local" });
      return securedRedirect(failure);
    }

    return securedRedirect(new URL(destination, siteOrigin()));
  } catch {
    return securedRedirect(failure);
  }
}

export async function handleAuthCallback(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.get("flow") === "oauth") {
    return handleOAuthCallback(params);
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
