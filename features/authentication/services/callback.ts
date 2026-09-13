import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath, siteOrigin } from "../lib/redirects";
import { tokenHashSchema } from "../lib/validation";

export async function handleAuthCallback(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const recovery =
    params.get("type") === "recovery" ||
    params.get("next") === "/reset-password";
  const destination = new URL(
    recovery ? "/reset-password" : "/verify-email",
    siteOrigin(),
  );
  // Do not consume email OTPs on GET: security scanners often prefetch links.
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
    else if (!recovery)
      destination.pathname = safeNextPath(params.get("next"), "/onboarding");
  } else destination.searchParams.set("status", "invalid");
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
