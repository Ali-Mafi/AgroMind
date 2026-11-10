// DISPOSABLE STAGING ONLY. Never deploy this harness to another project.
// Requests have an expiring ECDSA P-256 signature; no privileged key is returned.
import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import controller from "./controller.json" with { type: "json" };
import { authorizeUsername } from "./username-authorization.js";
import { authorizePassword } from "./password-authorization.js";

const ref = "lpkxwwdzuligovfgpfey";
const url = "https://" + ref + ".supabase.co";
const respond = (value: unknown, status = 200) => Response.json(value, {
  status, headers: { "Cache-Control": "no-store" },
});
const decode = (s: string) => Uint8Array.from(atob(s), x => x.charCodeAt(0));
const seen = new Set<string>();
Deno.serve(async request => {
  if (Deno.env.get("SUPABASE_URL") !== url || Date.now() > Date.parse(controller.expiresAt))
    return respond({ code: "HARNESS_DISABLED" }, 403);
  if (request.method !== "POST" || Number(request.headers.get("content-length") ?? 0) > 8192)
    return respond({ code: "REQUEST_REJECTED" }, 400);
  const body = await request.text();
  if (body.length > 8192) return respond({ code: "REQUEST_REJECTED" }, 400);
  const timestamp = request.headers.get("x-acceptance-time") ?? "";
  const signature = request.headers.get("x-acceptance-signature") ?? "";
  try {
    if (!/^\d{13}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 90000 || seen.has(signature))
      return respond({ code: "SIGNATURE_REJECTED" }, 401);
    const key = await crypto.subtle.importKey("spki", decode(controller.publicKey), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, decode(signature), new TextEncoder().encode(timestamp + "\n" + body)))
      return respond({ code: "SIGNATURE_REJECTED" }, 401);
    // Best-effort warm-isolate replay rejection. Operations below remain test-only;
    // create uses unique email; no arbitrary SQL, logout, deletion or key access.
    seen.add(signature);
    const input = JSON.parse(body);
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!service) return respond({ code: "STAGING_SERVICE_UNAVAILABLE" }, 503);
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    if (input.op === "health") return respond({ ref, candidate: controller.candidate, serverCredentialPresent: true });
    if (input.op === "service_acl") {
      const legacy = await admin.rpc("change_username", { p_username: "qa67_acl_denied" });
      const consume = await admin.rpc("change_username_authorized", { p_grant: crypto.randomUUID(), p_username: "qa67_acl_denied" });
      return respond({ legacyCode: legacy.error?.code ?? null, consumeCode: consume.error?.code ?? null });
    }
    if (input.op === "create") {
      if (!/^pr67_[a-z0-9_]{1,45}@example\.invalid$/.test(input.email ?? "") ||
          typeof input.password !== "string" || input.password.length < 20 || input.password.length > 100)
        return respond({ code: "SYNTHETIC_INPUT_REQUIRED" }, 400);
      const result = await admin.auth.admin.createUser({ email: input.email, password: input.password,
        email_confirm: true, user_metadata: { first_name: "Synthetic", last_name: "Acceptance", language: "en" } });
      if (result.error) return respond({ code: result.error.code ?? "ADMIN_CREATE_REJECTED", status: result.error.status }, 422);
      return respond({ id: result.data.user.id, confirmedByAdmin: Boolean(result.data.user.email_confirmed_at) });
    }
    if (input.op === "authorize" || input.op === "password") {
      const actor = await admin.auth.admin.getUserById(input.userId ?? "");
      if (!actor.data.user?.email?.match(/^pr67_[a-z0-9_]{1,45}@example\.invalid$/) ||
          (input.op === "authorize" && !/^qa67_[a-z0-9_]{1,25}$/.test(input.username ?? "")))
        return respond({ code: "SYNTHETIC_USER_REQUIRED" }, 403);
      const anon = Deno.env.get("SUPABASE_ANON_KEY");
      if (!anon) return respond({ code: "STAGING_ANON_UNAVAILABLE" }, 503);
      const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
      const session = await client.auth.setSession(input.session);
      if (session.error) return respond({ code: "SESSION_REJECTED" }, 401);
      const form = new FormData();
      form.set("proof_method", "totp"); form.set("proof_factor_id", input.factorId ?? ""); form.set("fresh_code", input.code ?? "");
      if (input.op === "password") {
        if (typeof input.password !== "string" || input.password.length < 20 || input.password.length > 100)
          return respond({ code: "SYNTHETIC_INPUT_REQUIRED" }, 400);
        form.set("expected_user_id", input.userId); form.set("password_context", "ordinary");
        form.set("current_password", input.currentPassword ?? "");
        if (input.backup) form.set("proof_method", "recovery");
        const authorization = await authorizePassword(client, form, input.password);
        const updated = await client.auth.updateUser({ password: input.password });
        return respond({ authorized: true, expectedUser: updated.data.user?.id === authorization.userId,
          error: updated.error ? { code: updated.error.code, status: updated.error.status } : null,
          session: (await client.auth.getSession()).data.session });
      }
      // Bundled unchanged from the exact candidate, except the build-only server marker.
      const grant = await authorizeUsername(client, form, input.username, input.userId);
      const current = await client.auth.getSession();
      return respond({ grant, session: current.data.session });
    }
    if (input.op === "rpc" && ["username_reserve_grant", "username_verify_grant"].includes(input.name)) {
      const user = await admin.auth.admin.getUserById(input.args?.p_user ?? "");
      if (!user.data.user?.email?.match(/^pr67_[a-z0-9_]{1,45}@example\.invalid$/))
        return respond({ code: "SYNTHETIC_USER_REQUIRED" }, 403);
      const result = await admin.rpc(input.name, input.args);
      return respond({ data: result.data, error: result.error ? {
        code: result.error.code, message: result.error.message.replace(/[^A-Z_0-9 ]/g, "").slice(0,100),
      } : null });
    }
    return respond({ code: "OPERATION_REJECTED" }, 400);
  } catch (error) {
    // Never log request bodies, tokens, credentials, provider payloads or MFA seeds.
    const code = error instanceof Error && /^[A-Z_]{1,80}$/.test(error.message) ? error.message : "REQUEST_REJECTED";
    return respond({ code, kind: error instanceof Error ? error.name : "unknown" }, 400);
  }
});
