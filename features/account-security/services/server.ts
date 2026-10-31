import "server-only";
import { createClient as createPrivilegedClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { SecuritySnapshot } from "../types/security";

export function securityWorker() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SECURITY_UNAVAILABLE");
  return createPrivilegedClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, {
      ...init, cache: "no-store",
      signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(5000)]),
    }) },
  });
}
export async function securityContext(client: Awaited<ReturnType<typeof createClient>>) {
  const user = await client.auth.getUser();
  if (user.error || !user.data.user?.email_confirmed_at) throw new Error("SECURITY_DENIED");
  // This RPC derives session_id from the verified request JWT, checks ownership,
  // not_after and the application deny list. Never decode an unverified cookie.
  const active = await client.rpc("get_current_session");
  const session = active.data as { id?: string } | null;
  if (active.error || !session?.id) throw new Error("SECURITY_DENIED");
  return { userId: user.data.user.id, sessionId: session.id };
}
export async function readSecuritySnapshot(): Promise<SecuritySnapshot> {
  const client = await createClient();
  await securityContext(client);
  const result = await client.rpc("security_snapshot");
  if (result.error || !result.data) throw new Error("SECURITY_UNAVAILABLE");
  return result.data as unknown as SecuritySnapshot;
}
export async function recordSecurityEvent(
  context: { userId: string; sessionId: string },
  kind: "logout" | "mfa_enrolled" | "mfa_removed" | "password_changed" | "username_changed",
  key: string,
) {
  try {
    const result = await securityWorker().rpc("security_record_event", {
      p_user: context.userId, p_session: context.sessionId, p_kind: kind, p_key: key,
    });
    if (result.error) throw result.error;
  } catch { console.error("[security] audit_write_failed", { kind }); }
}
