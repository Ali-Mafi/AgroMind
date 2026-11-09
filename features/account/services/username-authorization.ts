import "server-only";
import { createHmac } from "node:crypto";
import { createClient as createPrivilegedClient } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";
type Client = Awaited<ReturnType<typeof createClient>>;

async function context(client: Client) {
  const user = await client.auth.getUser();
  const claims = await client.auth.getClaims();
  const active = await client.rpc("get_current_session");
  const jwt = claims.data?.claims;
  if (user.error || !user.data.user?.email_confirmed_at || claims.error || jwt?.sub !== user.data.user.id ||
    typeof jwt.session_id !== "string" || active.error || !active.data) throw new Error("AUTH_REQUIRED");
  return { userId: user.data.user.id, sessionId: jwt.session_id };
}
// Only username-scoped attestation; not a generic password/session action API.
export async function authorizeUsername(client: Client, form: FormData, username: string, expectedUser: string) {
  const before = await context(client);
  if (before.userId !== expectedUser) throw new Error("AUTH_REQUIRED");
  const factor = String(form.get("proof_factor_id") ?? "");
  const code = String(form.get("fresh_code") ?? "").trim();
  if (!/^\d{6}$/.test(code) || form.get("proof_method") === "recovery") throw new Error("MFA_CHALLENGE_REQUIRED");
  const factors = await client.auth.mfa.listFactors();
  if (factors.error || !factors.data.totp.some(f => f.id === factor && f.status === "verified")) throw new Error("MFA_CHALLENGE_REQUIRED");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("AUTH_UNAVAILABLE");
  const worker = createPrivilegedClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.any([
      ...(init?.signal ? [init.signal] : []), AbortSignal.timeout(10000),
    ]) }) },
  });
  const reserved = await worker.rpc("username_reserve_grant", {
    p_user: before.userId, p_session: before.sessionId, p_factor: factor, p_username: username,
  });
  if (reserved.error || typeof reserved.data !== "string") throw new Error("AUTH_UNAVAILABLE");
  // Each request challenges/verifies the owned factor here, independent of old AAL2.
  const verified = await client.auth.mfa.challengeAndVerify({ factorId: factor, code });
  if (verified.error || verified.data?.user?.id !== before.userId || typeof verified.data.access_token !== "string" || !verified.data.access_token) throw new Error("MFA_CHALLENGE_REQUIRED");
  const after = await context(client);
  if (after.userId !== before.userId || after.sessionId !== before.sessionId) throw new Error("AUTH_REQUIRED");
  const proof = createHmac("sha256", key).update(JSON.stringify([before.userId,factor,code])).digest("hex");
  const attested = await worker.rpc("username_verify_grant", {
    p_id: reserved.data, p_user: before.userId, p_session: before.sessionId, p_factor: factor, p_proof_hash: proof,
  });
  if (attested.error || attested.data !== true) throw new Error("MFA_CHALLENGE_REQUIRED");
  return reserved.data;
}
