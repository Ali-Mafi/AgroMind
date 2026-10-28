import "server-only";
import { headers } from "next/headers";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { drainSupportEmails } from "@/features/support/services/notifications";
import { requestMetadata } from "../lib/metadata";
import { securityContext, securityWorker } from "./server";

// Called by real server auth paths and reconciled on protected requests. The DB
// transaction deduplicates by actual session_id and gates completion on MFA.
export async function observeLogin(provider?: "password" | "google" | "recovery") {
  try {
    const client = await createClient();
    const context = await securityContext(client);
    const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) throw assurance.error;
    const methods = assurance.data.currentAuthenticationMethods?.map(m => typeof m === "string" ? m : m.method) ?? [];
    const inferredProvider = methods.includes("password") ? "password" : methods.includes("oauth") ? "oauth" : methods.includes("recovery") ? "recovery" : null;
    const metadata = requestMetadata(new Headers(await headers()));
    const worker = securityWorker();
    const result = await worker.rpc("security_observe_session", {
      p_user: context.userId, p_session: context.sessionId,
      p_metadata: metadata, p_provider: provider ?? inferredProvider,
      p_aal: assurance.data.currentLevel,
    });
    if (result.error) throw result.error;
    if (result.data) after(() => drainSupportEmails());
  } catch {
    // Login remains available if notification infrastructure is down. A later
    // protected request reconciles the same real session and retries enqueue.
    console.error("[security] login_observation_failed");
  }
}
