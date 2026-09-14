"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "../lib/redirects";
import { currentUser } from "./session";
import type { MfaActionState, MfaSecurityState } from "../types/mfa";

const unavailable = "Account services are temporarily unavailable. Please try again.";
const codePattern = /^\d{6}$/;

async function signedInClient() {
  const user = await currentUser();
  if (!user || !user.email_confirmed_at) return null;
  return { user, supabase: await createClient() };
}

export async function readMfaSecurityState(): Promise<MfaSecurityState> {
  const context = await signedInClient();
  if (!context)
    return { enabled: false, factors: [], currentLevel: null, nextLevel: null };

  const [factors, assurance] = await Promise.all([
    context.supabase.auth.mfa.listFactors(),
    context.supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (factors.error || assurance.error) throw new Error(unavailable);

  return {
    enabled: factors.data.totp.some((factor) => factor.status === "verified"),
    factors: factors.data.totp
      .filter((factor) => factor.status === "verified")
      .map((factor) => ({
        id: factor.id,
        friendlyName: factor.friendly_name ?? "AgroMind Authenticator",
      })),
    currentLevel: assurance.data.currentLevel,
    nextLevel: assurance.data.nextLevel,
  };
}

export async function beginTotpEnrollmentAction(): Promise<
  | { error: string }
  | { factorId: string; qrCode: string; secret: string }
> {
  const context = await signedInClient();
  if (!context) return { error: "Sign in again to manage two-step verification." };

  try {
    const factors = await context.supabase.auth.mfa.listFactors();
    if (factors.error) return { error: unavailable };
    if (factors.data.totp.some((factor) => factor.status === "verified"))
      return { error: "Authenticator is already enabled." };

    for (const factor of factors.data.totp.filter(
      (candidate) => candidate.status !== "verified",
    )) {
      const removed = await context.supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });
      if (removed.error) return { error: unavailable };
    }

    const enrolled = await context.supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "AgroMind Authenticator",
    });
    if (enrolled.error) return { error: unavailable };

    return {
      factorId: enrolled.data.id,
      qrCode: enrolled.data.totp.qr_code,
      secret: enrolled.data.totp.secret,
    };
  } catch {
    return { error: "Authenticator setup could not be started. Please try again." };
  }
}

export async function verifyTotpEnrollmentAction(
  _state: MfaActionState,
  form: FormData,
): Promise<MfaActionState> {
  const factorId = String(form.get("factor_id") ?? "");
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!factorId || !codePattern.test(code))
    return { error: "Enter the 6-digit code from your authenticator app." };

  const context = await signedInClient();
  if (!context) return { error: "Sign in again to manage two-step verification." };

  try {
    const factors = await context.supabase.auth.mfa.listFactors();
    if (factors.error) return { error: unavailable };
    const factor = factors.data.totp.find(
      (candidate) => candidate.id === factorId && candidate.status !== "verified",
    );
    if (!factor) return { error: "Authenticator setup could not be started. Please try again." };

    const verified = await context.supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    if (verified.error)
      return {
        error: "That code is not valid. Try the newest code from your authenticator app.",
      };

    revalidatePath("/account/security");
    return { success: "Two-step verification is enabled." };
  } catch {
    return { error: unavailable };
  }
}

export async function disableTotpAction(
  _state: MfaActionState,
  form: FormData,
): Promise<MfaActionState> {
  const factorId = String(form.get("factor_id") ?? "");
  const context = await signedInClient();
  if (!context) return { error: "Sign in again to manage two-step verification." };

  try {
    const [factors, assurance] = await Promise.all([
      context.supabase.auth.mfa.listFactors(),
      context.supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (factors.error || assurance.error) return { error: unavailable };
    if (assurance.data.currentLevel !== "aal2")
      return {
        error: "Confirm your authenticator code before disabling two-step verification.",
      };

    const factor = factors.data.totp.find(
      (candidate) => candidate.id === factorId && candidate.status === "verified",
    );
    if (!factor) return { error: "No authenticator factor is available for this account." };

    const removed = await context.supabase.auth.mfa.unenroll({ factorId });
    if (removed.error)
      return { error: "Two-step verification could not be disabled. Please try again." };

    await context.supabase.auth.refreshSession();
    revalidatePath("/account/security");
    revalidatePath("/", "layout");
    return { success: "Two-step verification is disabled." };
  } catch {
    return { error: unavailable };
  }
}

export async function verifyMfaChallengeAction(
  _state: MfaActionState,
  form: FormData,
): Promise<MfaActionState> {
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  const destination = safeNextPath(form.get("next"));
  if (!codePattern.test(code))
    return { error: "Enter the 6-digit code from your authenticator app." };

  const context = await signedInClient();
  if (!context) redirect(`/sign-in?next=${encodeURIComponent(destination)}`);

  try {
    const factors = await context.supabase.auth.mfa.listFactors();
    if (factors.error) return { error: unavailable };
    const factor = factors.data.totp.find(
      (candidate) => candidate.status === "verified",
    );
    if (!factor)
      return { error: "No authenticator factor is available for this account." };

    const verified = await context.supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    });
    if (verified.error)
      return {
        error: "That code is not valid. Try the newest code from your authenticator app.",
      };
  } catch {
    return { error: unavailable };
  }

  revalidatePath("/", "layout");
  redirect(destination);
}
