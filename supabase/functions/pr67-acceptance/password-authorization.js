const process = { env: { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: Deno.env.get("SUPABASE_URL"), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Deno.env.get("SUPABASE_ANON_KEY"), SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), SUPABASE_RECOVERY_CODES_ENABLED: "false" } };
// features/authentication/services/password-authorization.ts

import { createHash, createHmac, randomBytes } from "node:crypto";

// acceptance:cookie
function cookies() {
  throw new Error("RECOVERY_NOT_SUPPORTED_BY_HARNESS");
}

// features/authentication/services/password-authorization.ts
import { createClient as createPrivilegedClient } from "@supabase/supabase-js";

// lib/supabase/config.ts
function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error("Account services are temporarily unavailable.");
  return { url, key };
}
var sessionCookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  // Auth and database operations run on the server. Browser code receives DTOs,
  // never tokens, and does not instantiate a Supabase auth client.
  httpOnly: true
};

// features/authentication/services/fresh-auth.ts

import {
  createClient as createIsolatedClient
} from "@supabase/supabase-js";
var freshAuthError = "Confirm your identity with a fresh code or your current password.";
async function verifyFreshIdentity(client, user, form) {
  const listed = await client.auth.mfa.listFactors();
  if (listed.error) return freshAuthError;
  const verified = listed.data.all.filter((f) => f.status === "verified");
  if (verified.length) {
    if (form.get("proof_method") === "recovery") {
      if (process.env.SUPABASE_RECOVERY_CODES_ENABLED !== "true")
        return freshAuthError;
      const code2 = String(form.get("fresh_recovery_code") ?? "").trim();
      if (code2.length < 8 || code2.length > 128) return freshAuthError;
      const result2 = await client.auth.mfa.recoveryCodes.verify({ code: code2 });
      return result2.error ? freshAuthError : null;
    }
    const factorId = String(form.get("proof_factor_id") ?? "");
    const code = String(form.get("fresh_code") ?? "").trim();
    if (!/^\d{6}$/.test(code) || !listed.data.totp.some(
      (f) => f.id === factorId && f.status === "verified"
    ))
      return freshAuthError;
    const result = await client.auth.mfa.challengeAndVerify({ factorId, code });
    return result.error ? freshAuthError : null;
  }
  const password = String(form.get("current_password") ?? "");
  if (!user.email || password.length < 1 || password.length > 128)
    return freshAuthError;
  const { url, key } = supabaseConfig();
  const isolated = createIsolatedClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
  try {
    const result = await isolated.auth.signInWithPassword({
      email: user.email,
      password
    });
    if (result.error || result.data.user?.id !== user.id) return freshAuthError;
    const factors = await isolated.auth.mfa.listFactors();
    if (factors.error || factors.data.all.some((f) => f.status === "verified"))
      return freshAuthError;
    return null;
  } finally {
    const cleanup = await isolated.auth.signOut({ scope: "local" });
    if (cleanup.error) throw new Error("Reauthentication cleanup failed.");
  }
}

// features/authentication/services/password-authorization.ts
var cookieName = "agromind_password_recovery";
var hash = (v) => createHash("sha256").update(v).digest("hex");
function passwordProofHash(...parts) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("PASSWORD_AUTH_UNAVAILABLE");
  return createHmac("sha256", key).update(JSON.stringify(parts)).digest("hex");
}
function passwordWorker() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("PASSWORD_AUTH_UNAVAILABLE");
  return createPrivilegedClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.any([
        ...init?.signal ? [init.signal] : [],
        AbortSignal.timeout(1e4)
      ])
    }) }
  });
}
async function passwordContext(client) {
  const user = await client.auth.getUser();
  const active = await client.rpc("get_current_session");
  const claims = await client.auth.getClaims();
  const verified = claims.data?.claims;
  if (user.error || !user.data.user?.email_confirmed_at || active.error || !active.data || claims.error || verified?.sub !== user.data.user.id || typeof verified.session_id !== "string")
    throw new Error("PASSWORD_AUTH_REQUIRED");
  return { user: user.data.user, sessionId: verified.session_id };
}
async function issuePasswordRecovery(client) {
  const context = await passwordContext(client);
  const token = randomBytes(32).toString("base64url");
  const result = await passwordWorker().rpc("password_issue_recovery", {
    p_user: context.user.id,
    p_session: context.sessionId,
    p_hash: hash(token)
  });
  if (result.error || result.data !== true) throw new Error("RECOVERY_REQUIRED");
  (await cookies()).set(cookieName, token, { ...sessionCookieOptions, sameSite: "strict", maxAge: 600 });
}
async function issuePkcePasswordRecovery(client) {
  const claims = await client.auth.getClaims();
  const context = await passwordContext(client);
  const value = claims.data?.claims;
  const now = Date.now() / 1e3;
  if (claims.error || value?.sub !== context.user.id || value.session_id !== context.sessionId || !Array.isArray(value.amr) || !value.amr.some((a) => typeof a === "object" && a !== null && a.method === "recovery" && typeof a.timestamp === "number" && a.timestamp > now - 120 && a.timestamp <= now + 30))
    throw new Error("RECOVERY_REQUIRED");
  await issuePasswordRecovery(client);
}
async function passwordRecoveryHash(client) {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const context = await passwordContext(client);
  const result = await passwordWorker().rpc("password_has_recovery", {
    p_user: context.user.id,
    p_session: context.sessionId,
    p_hash: hash(token)
  });
  if (result.error) throw new Error("PASSWORD_AUTH_UNAVAILABLE");
  return result.data === true ? hash(token) : null;
}
async function authorizePassword(client, form, password) {
  const context = await passwordContext(client);
  if (context.user.id !== form.get("expected_user_id")) throw new Error("ACCOUNT_CHANGED");
  const recovery = form.get("password_context") === "recovery";
  const recoveryHash = recovery ? await passwordRecoveryHash(client) : null;
  if (recovery && !recoveryHash) throw new Error("RECOVERY_REQUIRED");
  const operation = recovery ? "password_recovery" : "password_change";
  const payloadHash = passwordProofHash(operation, password);
  const worker = passwordWorker();
  const reserved = await worker.rpc("password_reserve", {
    p_user: context.user.id,
    p_session: context.sessionId,
    p_operation: operation,
    p_payload_hash: payloadHash,
    p_recovery_hash: recoveryHash
  });
  const grant = reserved.data;
  if (reserved.error || !grant?.id || typeof grant.requires_mfa !== "boolean") throw new Error("PASSWORD_AUTH_REQUIRED");
  let method = "email";
  let factor = null;
  let proof = passwordProofHash("email", recoveryHash ?? "");
  if (grant.requires_mfa || !recovery) {
    method = grant.requires_mfa ? form.get("proof_method") === "recovery" ? "backup" : "totp" : "password";
    factor = method === "totp" ? String(form.get("proof_factor_id") ?? "") : null;
    if (grant.requires_mfa) {
      const listed = await client.auth.mfa.listFactors();
      if (listed.error) throw new Error("PASSWORD_AUTH_REQUIRED");
      let verified;
      if (method === "backup") {
        const code = String(form.get("fresh_recovery_code") ?? "").trim();
        if (process.env.SUPABASE_RECOVERY_CODES_ENABLED !== "true" || code.length < 8 || code.length > 128)
          throw new Error("PASSWORD_AUTH_REQUIRED");
        verified = await client.auth.mfa.recoveryCodes.verify({ code });
      } else {
        const code = String(form.get("fresh_code") ?? "").trim();
        if (!/^\d{6}$/.test(code) || !listed.data.totp.some((f) => f.id === factor && f.status === "verified"))
          throw new Error("PASSWORD_AUTH_REQUIRED");
        verified = await client.auth.mfa.challengeAndVerify({ factorId: factor, code });
      }
      if (verified.error || verified.data?.user?.id !== context.user.id || typeof verified.data.access_token !== "string" || !verified.data.access_token)
        throw new Error("PASSWORD_AUTH_REQUIRED");
    } else if (await verifyFreshIdentity(client, context.user, form)) throw new Error("PASSWORD_AUTH_REQUIRED");
    proof = passwordProofHash(
      context.user.id,
      method,
      factor ?? "",
      String(form.get(method === "backup" ? "fresh_recovery_code" : method === "totp" ? "fresh_code" : "current_password") ?? "").trim()
    );
  }
  const after = await passwordContext(client);
  if (after.user.id !== context.user.id || after.sessionId !== context.sessionId) throw new Error("ACCOUNT_CHANGED");
  const consumed = await worker.rpc("password_consume", {
    p_id: grant.id,
    p_user: context.user.id,
    p_session: context.sessionId,
    p_operation: operation,
    p_payload_hash: payloadHash,
    p_method: method,
    p_factor: factor,
    p_proof_hash: proof
  });
  if (consumed.error || consumed.data !== true) throw new Error("PASSWORD_AUTH_REQUIRED");
  if (recovery) (await cookies()).delete(cookieName);
  return { userId: context.user.id, recovery };
}
export {
  authorizePassword,
  issuePasswordRecovery,
  issuePkcePasswordRecovery,
  passwordContext,
  passwordProofHash,
  passwordRecoveryHash,
  passwordWorker
};
