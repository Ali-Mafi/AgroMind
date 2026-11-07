import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createClient as createPrivilegedClient } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";
import { sessionCookieOptions } from "@/lib/supabase/config";
import { verifyFreshIdentity } from "./fresh-auth";

type Client = Awaited<ReturnType<typeof createClient>>;
const cookieName = "agromind_password_recovery";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
// Passwords and short OTPs are protected by a server-held HMAC key, never a
// dictionary-testable unkeyed digest. No plaintext secret enters the database.
export function passwordProofHash(...parts: string[]) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("PASSWORD_AUTH_UNAVAILABLE");
  return createHmac("sha256", key).update(JSON.stringify(parts)).digest("hex");
}
export function passwordWorker() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("PASSWORD_AUTH_UNAVAILABLE");
  return createPrivilegedClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, {
      ...init, cache: "no-store", signal: AbortSignal.any([
        ...(init?.signal ? [init.signal] : []), AbortSignal.timeout(10000),
      ]),
    }) },
  });
}
export async function passwordContext(client: Client) {
  const user = await client.auth.getUser();
  const active = await client.rpc("get_current_session");
  const claims = await client.auth.getClaims();
  const verified = claims.data?.claims;
  if (user.error || !user.data.user?.email_confirmed_at || active.error || !active.data || claims.error ||
    verified?.sub !== user.data.user.id || typeof verified.session_id !== "string")
    throw new Error("PASSWORD_AUTH_REQUIRED");
  return { user: user.data.user, sessionId: verified.session_id };
}
// Only call immediately after a successful provider recovery verification.
export async function issuePasswordRecovery(client: Client) {
  const context = await passwordContext(client);
  const token = randomBytes(32).toString("base64url");
  const result = await passwordWorker().rpc("password_issue_recovery", {
    p_user: context.user.id, p_session: context.sessionId, p_hash: hash(token),
  });
  if (result.error || result.data !== true) throw new Error("RECOVERY_REQUIRED");
  (await cookies()).set(cookieName, token, { ...sessionCookieOptions, sameSite: "strict", maxAge: 600 });
}
export async function issuePkcePasswordRecovery(client: Client) {
  const claims = await client.auth.getClaims();
  const context = await passwordContext(client);
  const value = claims.data?.claims;
  const now = Date.now() / 1000;
  if (claims.error || value?.sub !== context.user.id || value.session_id !== context.sessionId ||
    !Array.isArray(value.amr) || !value.amr.some(a => typeof a === "object" && a !== null && a.method === "recovery" &&
      typeof a.timestamp === "number" && a.timestamp > now - 120 && a.timestamp <= now + 30))
    throw new Error("RECOVERY_REQUIRED");
  await issuePasswordRecovery(client);
}
export async function passwordRecoveryHash(client: Client): Promise<string | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const context = await passwordContext(client);
  const result = await passwordWorker().rpc("password_has_recovery", {
    p_user: context.user.id, p_session: context.sessionId, p_hash: hash(token),
  });
  if (result.error) throw new Error("PASSWORD_AUTH_UNAVAILABLE");
  return result.data === true ? hash(token) : null;
}
export async function authorizePassword(client: Client, form: FormData, password: string) {
  const context = await passwordContext(client);
  if (context.user.id !== form.get("expected_user_id")) throw new Error("ACCOUNT_CHANGED");
  const recovery = form.get("password_context") === "recovery";
  const recoveryHash = recovery ? await passwordRecoveryHash(client) : null;
  if (recovery && !recoveryHash) throw new Error("RECOVERY_REQUIRED");
  const operation = recovery ? "password_recovery" : "password_change";
  const payloadHash = passwordProofHash(operation, password);
  const worker = passwordWorker();
  const reserved = await worker.rpc("password_reserve", {
    p_user: context.user.id, p_session: context.sessionId, p_operation: operation,
    p_payload_hash: payloadHash, p_recovery_hash: recoveryHash,
  });
  const grant = reserved.data as { id?: string; requires_mfa?: boolean } | null;
  if (reserved.error || !grant?.id || typeof grant.requires_mfa !== "boolean") throw new Error("PASSWORD_AUTH_REQUIRED");
  let method = "email";
  let factor: string | null = null;
  let proof = passwordProofHash("email", recoveryHash ?? "");
  if (grant.requires_mfa || !recovery) {
    method = grant.requires_mfa ? (form.get("proof_method") === "recovery" ? "backup" : "totp") : "password";
    factor = method === "totp" ? String(form.get("proof_factor_id") ?? "") : null;
    // This is a new provider verification inside this specific operation.
    if (await verifyFreshIdentity(client, context.user, form)) throw new Error("PASSWORD_AUTH_REQUIRED");
    proof = passwordProofHash(context.user.id, method, factor ?? "",
      String(form.get(method === "backup" ? "fresh_recovery_code" : method === "totp" ? "fresh_code" : "current_password") ?? "").trim());
  }
  const after = await passwordContext(client);
  if (after.user.id !== context.user.id || after.sessionId !== context.sessionId) throw new Error("ACCOUNT_CHANGED");
  const consumed = await worker.rpc("password_consume", {
    p_id: grant.id, p_user: context.user.id, p_session: context.sessionId,
    p_operation: operation, p_payload_hash: payloadHash, p_method: method, p_factor: factor, p_proof_hash: proof,
  });
  if (consumed.error || consumed.data !== true) throw new Error("PASSWORD_AUTH_REQUIRED");
  // The durable receipt already consumed any recovery ticket. Cookie deletion is
  // cleanup, never the single-use boundary; response loss cannot reopen it.
  if (recovery) (await cookies()).delete(cookieName);
  return { userId: context.user.id, recovery };
}
