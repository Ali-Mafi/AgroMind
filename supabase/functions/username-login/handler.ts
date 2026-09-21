import type { SupabaseClient } from "npm:@supabase/supabase-js@2.116.0";

type Dependencies = {
  admin: SupabaseClient;
  auth: SupabaseClient;
  hashKey: string;
  captchaSecret?: string;
  captchaHostname?: string;
  fetcher?: typeof fetch;
};
const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};
const response = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), { status, headers });

async function boundedPayload(
  request: Request,
): Promise<Record<string, unknown>> {
  if (
    !request.body ||
    Number(request.headers.get("content-length") ?? 0) > 4096
  )
    throw new Error("INVALID_BODY");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "",
    length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) {
        await reader.cancel();
        throw new Error("INVALID_BODY");
      }
      body += decoder.decode(value, { stream: true });
    }
    const parsed = JSON.parse(body + decoder.decode());
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("INVALID_BODY");
    return parsed;
  } finally {
    reader.releaseLock();
  }
}

export function createUsernameLoginHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return response("method_not_allowed", 405);
    let payload: Record<string, unknown>;
    try {
      payload = await boundedPayload(request);
    } catch {
      return response("invalid_request", 400);
    }
    const username =
      typeof payload.username === "string"
        ? payload.username.trim().toLowerCase()
        : "";
    const password =
      typeof payload.password === "string" ? payload.password : "";
    if (
      !/^[a-z0-9_]{3,30}$/.test(username) ||
      password.length < 1 ||
      password.length > 128
    )
      return response("invalid_credentials", 401);
    try {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(deps.hashKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const hash = new Uint8Array(
        await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode(username),
        ),
      );
      const identifier = Array.from(hash, (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      const limited = await deps.admin.rpc("consume_username_login_attempt", {
        p_identifier_hash: identifier,
      });
      if (limited.error) return response("service_unavailable", 503); // Never bypass a broken limiter.
      if (limited.data !== true) return response("too_many_attempts", 429);
      // Optional Turnstile is verified here, including hostname/action binding.
      // No forwarded IP is trusted for authorization or rate-limit identity.
      if (deps.captchaSecret) {
        const token =
          typeof payload.captcha_token === "string"
            ? payload.captcha_token
            : "";
        if (!token || token.length > 2048)
          return response("verification_required", 400);
        const check = await (deps.fetcher ?? fetch)(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            body: new URLSearchParams({
              secret: deps.captchaSecret,
              response: token,
            }),
            signal: AbortSignal.timeout(5000),
          },
        );
        const result = await check.json();
        if (
          !check.ok ||
          result.success !== true ||
          result.hostname !== (deps.captchaHostname ?? "agromind.ir") ||
          result.action !== "username-login"
        )
          return response("verification_required", 400);
      }
      const profile = await deps.admin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (profile.error) return response("service_unavailable", 503);
      const identity = profile.data
        ? await deps.admin.auth.admin.getUserById(profile.data.id)
        : null;
      if (identity?.error) return response("service_unavailable", 503);
      const email = identity?.data.user?.email;
      // Missing usernames still take the provider password-validation path.
      const result = await deps.auth.auth.signInWithPassword({
        email: email ?? "username-login-unmatched@invalid.invalid",
        password,
      });
      if (result.error?.status === 429)
        return response("too_many_attempts", 429);
      if (!email || result.error || !result.data.session)
        return response("invalid_credentials", 401);
      return new Response(
        JSON.stringify({
          access_token: result.data.session.access_token,
          refresh_token: result.data.session.refresh_token,
        }),
        { headers },
      );
    } catch {
      return response("service_unavailable", 503);
    }
  };
}
