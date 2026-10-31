import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { createClient } from "@/lib/supabase/server";
import { sessionCookieOptions } from "@/lib/supabase/config";
import { securityContext, securityWorker } from "@/features/account-security/services/server";

const cookieName = "agromind_password_recovery";
type Client = Awaited<ReturnType<typeof createClient>>;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

// Call only immediately after verifyOtp(type: 'recovery') has succeeded.
export async function issueRecoveryAuthorization(client: Client) {
  const context = await securityContext(client);
  const token = randomBytes(32).toString("base64url");
  const result = await securityWorker().rpc("security_issue_recovery", {
    p_user: context.userId, p_session: context.sessionId, p_hash: hash(token),
  });
  if (result.error) throw new Error("SECURITY_RECOVERY_UNAVAILABLE");
  (await cookies()).set(cookieName, token, { ...sessionCookieOptions, sameSite: "strict", maxAge: 600 });
}

// PKCE URL query parameters and the SDK's local redirectType are not proof.
// Only a signature-verified, fresh provider recovery AMR may bootstrap a ticket.
export async function issuePkceRecoveryAuthorization(client: Client) {
  const claims = await client.auth.getClaims();
  const amr = claims.data?.claims.amr;
  const now = Date.now() / 1000;
  if (claims.error || !Array.isArray(amr) || !amr.some(a => typeof a === "object" && a !== null && a.method === "recovery" && typeof a.timestamp === "number" && a.timestamp <= now + 30 && a.timestamp > now - 120))
    throw new Error("SECURITY_RECOVERY_REQUIRED");
  const context = await securityContext(client);
  if (claims.data?.claims.sub !== context.userId || claims.data.claims.session_id !== context.sessionId)
    throw new Error("SECURITY_RECOVERY_REQUIRED");
  await issueRecoveryAuthorization(client);
}

export async function recoveryAuthorization(client: Client): Promise<string | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const context = await securityContext(client);
  const tokenHash = hash(token);
  const result = await securityWorker().rpc("security_has_recovery", {
    p_user: context.userId, p_session: context.sessionId, p_hash: tokenHash,
  });
  if (result.error) throw new Error("SECURITY_RECOVERY_UNAVAILABLE");
  return result.data === true ? tokenHash : null;
}

export async function clearRecoveryAuthorization() {
  (await cookies()).delete(cookieName);
}
