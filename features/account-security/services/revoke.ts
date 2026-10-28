import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { securityContext, securityWorker } from "./server";

const unavailable = "Account services are temporarily unavailable. Please try again.";
const fresh = "Enter a fresh 6-digit authenticator code to sign out remote sessions.";
export async function revokeRemoteSessions(form: FormData): Promise<{ error?: string; success?: string; global?: boolean }> {
  let operation: string | null = null;
  let userId: string | null = null;
  try {
    // Defense in depth over Next's POST/Origin checks, including missing Origin.
    const h = await headers();
    const origin = h.get("origin");
    if (!origin || new URL(origin).host !== h.get("host") || (process.env.NODE_ENV === "production" && new URL(origin).protocol !== "https:"))
      return { error: unavailable };
    const scope = form.get("scope");
    if (scope !== "others" && scope !== "global") return { error: unavailable };
    // No selective IDs are accepted by this operation.
    if (form.has("session_id") || form.has("target_session_id")) return { error: unavailable };
    const client = await createClient();
    const context = await securityContext(client);
    userId = context.userId;
    const factors = await client.auth.mfa.listFactors();
    if (factors.error) return { error: unavailable };
    const verified = factors.data.totp.filter(f => f.status === "verified");
    if (!verified.length) return { error: "Set up an authenticator before signing out remote sessions." };
    const factorId = String(form.get("proof_factor_id") ?? "");
    const code = String(form.get("fresh_code") ?? "").trim();
    if (!/^\d{6}$/.test(code) || !verified.some(f => f.id === factorId) || form.get("proof_method") === "recovery") return { error: fresh };
    const worker = securityWorker();
    // A keyed digest prevents brute-forcing six-digit OTPs from a DB leak. This
    // secret never crosses the server boundary; codes are never stored or logged.
    const proofHash = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
      .update(JSON.stringify(["session-revocation", userId, factorId, code])).digest("hex");
    const begun = await worker.rpc("security_begin_revocation", { p_user: userId, p_session: context.sessionId, p_factor: factorId, p_scope: scope, p_proof_hash: proofHash });
    if (begun.error || typeof begun.data !== "string") return { error: "Too many or overlapping security attempts. Wait a few minutes and use a new code." };
    operation = begun.data;
    // Always a NEW native challenge, even when the cookie already carries AAL2.
    const challenged = await client.auth.mfa.challenge({ factorId });
    if (challenged.error) throw new Error("SECURITY_CHALLENGE_FAILED");
    const verifiedProof = await client.auth.mfa.verify({ factorId, challengeId: challenged.data.id, code });
    if (verifiedProof.error) {
      await worker.rpc("security_finish_revocation", { p_id: operation, p_user: userId, p_success: false });
      return { error: fresh };
    }
    const consumed = await worker.rpc("security_consume_revocation", { p_id: operation, p_user: userId, p_session: context.sessionId });
    if (consumed.error || !consumed.data || typeof consumed.data !== "object" || Array.isArray(consumed.data) || consumed.data.scope !== scope) throw new Error("SECURITY_PROOF_EXPIRED");
    // The atomic consume above blocks the owned snapshot in all existing RLS/RPC
    // guards. Native Auth then revokes refresh credentials using supported scopes.
    const result = await client.auth.signOut({ scope });
    const finished = await worker.rpc("security_finish_revocation", { p_id: operation, p_user: userId, p_success: !result.error });
    if (result.error || finished.error || finished.data !== true)
      return { error: "Session access is blocked, but provider sign-out could not be confirmed. Refresh and try again." };
    return { success: "Other sessions have been signed out.", global: scope === "global" };
  } catch {
    if (operation && userId) {
      try { await securityWorker().rpc("security_finish_revocation", { p_id: operation, p_user: userId, p_success: false }); } catch { /* Fail closed: consumed access blocks remain. */ }
    }
    return { error: unavailable };
  }
}
