import type { SupabaseClient } from "npm:@supabase/supabase-js@2.116.0";

type Dependencies = {
  admin: SupabaseClient;
  auth: SupabaseClient;
};

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const response = (
  payload: Record<string, unknown>,
  status = 200,
) => new Response(JSON.stringify(payload), { status, headers });

async function boundedPayload(
  request: Request,
): Promise<Record<string, unknown>> {
  if (
    !request.body ||
    Number(request.headers.get("content-length") ?? 0) > 4096
  ) {
    throw new Error("INVALID_BODY");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let length = 0;

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
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("INVALID_BODY");
    }
    return parsed;
  } finally {
    reader.releaseLock();
  }
}

export function createPendingEmailChangeHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return response({ error: "method_not_allowed" }, 405);
    }

    let payload: Record<string, unknown>;
    try {
      payload = await boundedPayload(request);
    } catch {
      return response({ error: "invalid_request" }, 400);
    }

    const tokenHash =
      typeof payload.token_hash === "string"
        ? payload.token_hash.trim().toLowerCase()
        : "";
    const email =
      typeof payload.email === "string"
        ? payload.email.trim().toLowerCase()
        : "";
    const redirectTo =
      typeof payload.redirect_to === "string"
        ? payload.redirect_to.trim()
        : "";

    if (
      !/^[a-f0-9]{64}$/.test(tokenHash) ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^https:\/\/agromind\.ir\/auth\/callback$/.test(redirectTo)
    ) {
      return response({ error: "invalid_request" }, 400);
    }

    try {
      const lookup = await deps.admin.rpc("pending_signup_user_id", {
        p_token_hash: tokenHash,
      });
      if (lookup.error) {
        return response({ error: "service_unavailable" }, 503);
      }

      const userId = typeof lookup.data === "string" ? lookup.data : null;
      if (!userId) {
        return response({ error: "pending_signup_expired" }, 410);
      }

      const current = await deps.admin.auth.admin.getUserById(userId);
      if (current.error || !current.data.user) {
        return response({ error: "service_unavailable" }, 503);
      }
      if (current.data.user.email_confirmed_at) {
        return response({ error: "already_verified" }, 409);
      }

      if (current.data.user.email?.toLowerCase() !== email) {
        const updated = await deps.admin.auth.admin.updateUserById(userId, {
          email,
        });
        if (updated.error) {
          if (
            ["email_exists", "user_already_exists"].includes(
              updated.error.code ?? "",
            )
          ) {
            return response({ error: "email_taken" }, 409);
          }
          return response({ error: "service_unavailable" }, 503);
        }
      }

      const resent = await deps.auth.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (resent.error?.status === 429) {
        return response({
          updated: true,
          sent: false,
          reason: "rate_limited",
        });
      }

      if (resent.error) {
        return response({
          updated: true,
          sent: false,
          reason: "send_failed",
        });
      }

      return response({ updated: true, sent: true });
    } catch {
      return response({ error: "service_unavailable" }, 503);
    }
  };
}
