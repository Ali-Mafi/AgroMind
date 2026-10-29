import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";
import { verifyFreshIdentity } from "@/features/authentication/services/fresh-auth";
import { securityContext, securityWorker } from "./server";

type Client = Awaited<ReturnType<typeof createClient>>;
export type CredentialOperation = "username" | "password_change" | "password_recovery";

export async function requireSecurityOrigin() {
  const h = await headers();
  const raw = h.get("origin");
  if (!raw) throw new Error("SECURITY_ORIGIN");
  const origin = new URL(raw);
  if (origin.host !== h.get("host") || (process.env.NODE_ENV === "production" && origin.protocol !== "https:"))
    throw new Error("SECURITY_ORIGIN");
}

// Shared across actions. Keep the original revocation HMAC domain so reservations
// made before this upgrade retain their replay protection.
export function securityProofHash(user: string, factor: string, code: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SECURITY_UNAVAILABLE");
  return createHmac("sha256", secret).update(JSON.stringify(["session-revocation", user, factor, code])).digest("hex");
}

export function credentialPayloadHash(operation: CredentialOperation, value: string) {
  return operation === "username"
    ? createHash("sha256").update(value).digest("hex")
    : securityProofHash(operation, "payload", value);
}

// Reservation/verification happen inside the request. IDs/proof flags never go to
// the browser. The mutation consumes a verified grant at its own DB boundary.
export async function authorizeCredentialAction(
  client: Client, user: User, form: FormData, operation: CredentialOperation,
  payloadHash: string, recoveryHash: string | null = null,
) {
  await requireSecurityOrigin();
  const context = await securityContext(client);
  if (context.userId !== user.id) throw new Error("SECURITY_DENIED");
  const listed = await client.auth.mfa.listFactors();
  if (listed.error) throw new Error("SECURITY_UNAVAILABLE");
  const hasMfa = listed.data.all.some(f => f.status === "verified");
  const factor = String(form.get("proof_factor_id") ?? "");
  const code = String(form.get("fresh_code") ?? "").trim();
  const recoveryCode = operation === "password_recovery" && hasMfa && form.get("proof_method") === "recovery";
  const kind = hasMfa ? (recoveryCode ? "recovery_code" : "totp") : operation === "password_recovery" ? "recovery_link" : "password";
  if (operation === "username" && kind !== "totp") throw new Error("SECURITY_TOTP_REQUIRED");
  if (kind === "totp" && (!/^\d{6}$/.test(code) || !listed.data.totp.some(f => f.id === factor && f.status === "verified") || form.get("proof_method") === "recovery"))
    throw new Error("SECURITY_TOTP_REQUIRED");
  const proofHash = kind === "totp" ? securityProofHash(user.id, factor, code)
    : kind === "recovery_code" ? securityProofHash(user.id, "recovery", String(form.get("fresh_recovery_code") ?? "").trim())
    : securityProofHash(user.id, kind, randomUUID());
  const worker = securityWorker();
  const begun = await worker.rpc("security_begin_action", {
    p_user: user.id, p_session: context.sessionId, p_operation: operation, p_payload_hash: payloadHash,
    p_kind: kind, p_factor: kind === "totp" ? factor : null, p_proof_hash: proofHash, p_recovery_hash: recoveryHash,
  });
  if (begun.error || typeof begun.data !== "string") throw new Error("SECURITY_RATE_OR_REPLAY");
  const id = begun.data;
  try {
    if (kind === "totp") {
      const challenge = await client.auth.mfa.challenge({ factorId: factor });
      if (challenge.error) throw new Error("SECURITY_PROOF_FAILED");
      const verified = await client.auth.mfa.verify({ factorId: factor, challengeId: challenge.data.id, code });
      if (verified.error) throw new Error("SECURITY_PROOF_FAILED");
    } else if (kind !== "recovery_link") {
      if (await verifyFreshIdentity(client, user, form)) throw new Error("SECURITY_PROOF_FAILED");
    }
    const after = await securityContext(client);
    if (after.userId !== context.userId || after.sessionId !== context.sessionId) throw new Error("SECURITY_SESSION_CHANGED");
    const authorized = await worker.rpc("security_authorize_action", { p_id: id, p_user: user.id, p_session: context.sessionId, p_verified: true });
    if (authorized.error) throw new Error("SECURITY_PROOF_EXPIRED");
    return { id, context, worker };
  } catch (error) {
    try { await worker.rpc("security_authorize_action", { p_id: id, p_user: user.id, p_session: context.sessionId, p_verified: false }); } catch { /* Reservation expires; never grant on error. */ }
    throw error;
  }
}
