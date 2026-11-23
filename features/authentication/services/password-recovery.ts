import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createClient as createIsolatedClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { sessionCookieOptions, supabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
const cookieName = "agromind_password_recovery";
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export const recoveryRequired = "Your session has expired. Request a new password reset email.";

function isolatedClient(key: string) {
  return createIsolatedClient<Database>(supabaseConfig().url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function recoveryService() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Recovery authorization is unavailable.");
  return isolatedClient(key);
}

export function recoveryVerifier() {
  return isolatedClient(supabaseConfig().key);
}

export async function recoveryIdentity(client: Client, accessToken?: string) {
  const { data, error } = await client.auth.getClaims(accessToken);
  const claims = data?.claims;
  if (error || !claims || typeof claims.session_id !== "string" ||
      !uuid.test(claims.session_id)) return null;
  const result = await client.auth.getUser(accessToken);
  const user = result.data.user;
  if (result.error || !user?.email_confirmed_at || user.id !== claims.sub) return null;
  return { user, sessionId: claims.session_id, aal: claims.aal };
}

export async function issuePasswordRecovery(
  client: Client,
  accessToken: string,
  proof: { userId: string; emailProofHash: string },
) {
  const identity = await recoveryIdentity(client, accessToken);
  if (identity?.user.id !== proof.userId) return false;
  const capability = randomBytes(32).toString("base64url");
  const result = await recoveryService().rpc("issue_password_recovery", {
    p_user: identity.user.id,
    p_session: identity.sessionId,
    p_hash: digest(capability),
    p_email_proof: proof.emailProofHash,
  });
  if (result.error || result.data !== true) return false;
  (await cookies()).set(cookieName, capability, {
    ...sessionCookieOptions, sameSite: "strict", maxAge: 600,
  });
  return true;
}

export async function readPasswordRecovery(client: Client) {
  const capability = (await cookies()).get(cookieName)?.value;
  if (!capability || !/^[A-Za-z0-9_-]{43}$/.test(capability)) return null;
  const identity = await recoveryIdentity(client);
  if (!identity) return null;
  const attempt = digest(capability);
  const result = await recoveryService().rpc("has_password_recovery", {
    p_user: identity.user.id,
    p_session: identity.sessionId,
    p_hash: attempt,
  });
  if (result.error || result.data !== true) return null;
  return { ...identity, attempt };
}

export async function consumePasswordRecovery(
  recovery: NonNullable<Awaited<ReturnType<typeof readPasswordRecovery>>>,
  factorId?: string,
) {
  // The same request that verified TOTP attests its factor. The database
  // checks current enrollment and consumes the ticket before the provider write.
  const result = await recoveryService().rpc("consume_password_recovery", {
    p_user: recovery.user.id,
    p_session: recovery.sessionId,
    p_hash: recovery.attempt,
    ...(factorId ? { p_factor: factorId } : {}),
  });
  return !result.error && result.data === true;
}
