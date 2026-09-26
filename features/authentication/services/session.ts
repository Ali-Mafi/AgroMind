import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "../lib/redirects";

export const currentUser = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const session = await supabase.rpc("get_current_session");
  if (session.error)
    throw new Error("Account services are temporarily unavailable.");
  return session.data ? data.user : null;
});

export async function needsSecondFactor() {
  const supabase = await createClient();
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw new Error("Account services are temporarily unavailable.");
  return data.nextLevel === "aal2" && data.currentLevel !== "aal2";
}

export const requireUser = cache(async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!user.email_confirmed_at) redirect("/verify-email");
  if (await needsSecondFactor()) redirect("/mfa");
  return user;
});

export async function authenticatedDestination(requestedNext?: unknown) {
  const user = await currentUser();
  if (!user) return null;
  if (!user.email_confirmed_at) return "/verify-email";

  // Once MFA is enrolled, the database RLS gate intentionally blocks profile
  // reads from an aal1 session. Check the assurance level first so sign-in can
  // continue to the MFA challenge instead of failing on the protected query.
  if (await needsSecondFactor())
    return `/mfa?next=${encodeURIComponent(safeNextPath(requestedNext))}`;

  const safeNext = safeNextPath(requestedNext);
  if (safeNext.startsWith("/invite/")) return safeNext;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();
  if (error) throw new Error("Account services are temporarily unavailable.");
  return data.onboarding_completed ? safeNext : "/onboarding";
}
