import "server-only";
import { securityProofHash } from "./action-proof";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { securityContext, securityWorker } from "./server";

const unavailable = "Account services are temporarily unavailable. Please try again.";
const fresh = "Enter a fresh 6-digit authenticator code to sign out remote sessions.";
export async function revokeRemoteSessions(form: FormData): Promise<{ error?: string; success?: string; global?: boolean; pending?: boolean }> {
  let consumedProof = false;
  let globalScope = false;
  let operation: string | null = null;
  let userId: string | null = null;
  let originSession: string | null = null;
  try {
    // Defense in depth over Next's POST/Origin checks, including missing Origin.
    const h = await headers();
    const origin = h.get("origin");
    if (!origin || new URL(origin).host !== h.get("host") || (process.env.NODE_ENV === "production" && new URL(origin).protocol !== "https:"))
      return { error: unavailable };
    const scope = form.get("scope");
    globalScope = scope === "global";
    if (scope !== "others" && scope !== "global") return { error: unavailable };
    // No selective IDs are accepted by this operation.
    if (form.has("session_id") || form.has("target_session_id")) return { error: unavailable };
    const client = await createClient();
    const context = await securityContext(client);
    userId = context.userId;
    originSession = context.sessionId;
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
    const proofHash = securityProofHash(userId, factorId, code);
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
    consumedProof = true;
    // The atomic consume above blocks the owned snapshot in all existing RLS/RPC
    // guards. Native Auth then revokes refresh credentials using supported scopes.
    const result = await client.auth.signOut({ scope });
    const finished = await worker.rpc("security_finish_revocation", { p_id: operation, p_user: userId, p_success: !result.error });
    if (finished.error || finished.data !== true)
      return { error: "Session access is blocked, but provider sign-out could not be confirmed. Sign in again and use a new authenticator code to complete sign-out.", pending: true, global: globalScope };
    return { success: "Other sessions have been signed out.", global: scope === "global" };
  } catch {
    if (operation && userId && originSession) {
      const worker = securityWorker();
      // A lost consume RPC response may still have committed denial. Query
      // authoritative state; never replay a consumed proof to guess its result.
      try {
        await worker.rpc("security_finish_revocation", {
          p_id: operation, p_user: userId, p_success: false,
        });
      } catch { /* Keep existing denials; subsequent status read may still work. */ }
      try {
        const lookup = await worker.rpc("security_revocation_status", {
          p_id: operation, p_user: userId, p_session: originSession,
        });
        const state = lookup.data as { state?: string; consumed?: boolean; scope?: string } | null;
        if (!lookup.error && state?.consumed === true && state.scope === (globalScope ? "global" : "others")) {
          if (state.state === "completed")
            return { success: "Other sessions have been signed out.", global: globalScope };
          if (state.state === "pending" || state.state === "executing")
            return { error: "Session access is blocked, but provider sign-out could not be confirmed. Sign in again and use a new authenticator code to complete sign-out.", pending: true, global: globalScope };
        }
        if (!lookup.error && (!state || !state.consumed))
          return { error: unavailable };
      } catch { /* Unknown state: do not invent confirmed denial. */ }
    }
    // Only a confirmed consume response permits an unconditional denial claim.
    if (consumedProof)
      return { error: "Session access is blocked, but provider sign-out could not be confirmed. Sign in again and use a new authenticator code to complete sign-out.", pending: true, global: globalScope };
    return { error: "Session revocation could not be verified. Your session may be restricted. Sign in again if access is unavailable." };
  }
}
