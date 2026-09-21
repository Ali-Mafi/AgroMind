import "server-only";
import {
  createClient as createIsolatedClient,
  type User,
} from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/supabase/config";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
export const freshAuthError =
  "Confirm your identity with a fresh code or your current password.";

// This proof is consumed within the sensitive action. No reusable client flag,
// timestamp, password, OTP or custom authorization token is stored.
export async function verifyFreshIdentity(
  client: Client,
  user: User,
  form: FormData,
): Promise<string | null> {
  const listed = await client.auth.mfa.listFactors();
  if (listed.error) return freshAuthError;
  const verified = listed.data.all.filter((f) => f.status === "verified");
  if (verified.length) {
    if (form.get("proof_method") === "recovery") {
      if (process.env.SUPABASE_RECOVERY_CODES_ENABLED !== "true")
        return freshAuthError;
      const code = String(form.get("fresh_recovery_code") ?? "").trim();
      if (code.length < 8 || code.length > 128) return freshAuthError;
      const result = await client.auth.mfa.recoveryCodes.verify({ code });
      return result.error ? freshAuthError : null;
    }
    const factorId = String(form.get("proof_factor_id") ?? "");
    const code = String(form.get("fresh_code") ?? "").trim();
    if (
      !/^\d{6}$/.test(code) ||
      !listed.data.totp.some(
        (f) => f.id === factorId && f.status === "verified",
      )
    )
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
      detectSessionInUrl: false,
    },
  });
  try {
    const result = await isolated.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (result.error || result.data.user?.id !== user.id) return freshAuthError;
    // A concurrent enrollment must not let password-only proof authorize an action.
    const factors = await isolated.auth.mfa.listFactors();
    if (factors.error || factors.data.all.some((f) => f.status === "verified"))
      return freshAuthError;
    return null;
  } finally {
    const cleanup = await isolated.auth.signOut({ scope: "local" });
    if (cleanup.error) throw new Error("Reauthentication cleanup failed.");
  }
}
