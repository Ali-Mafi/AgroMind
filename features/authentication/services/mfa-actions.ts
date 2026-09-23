"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeMfaNextPath } from "../lib/redirects";
import { currentUser } from "./session";
import { verifyFreshIdentity } from "./fresh-auth";
import type {
  MfaActionState,
  MfaSecurityState,
  RecoveryCodesResult,
} from "../types/mfa";

const unavailable =
  "Account services are temporarily unavailable. Please try again.";
const codePattern = /^\d{6}$/;
const emptyRecoveryState = {
  available: false,
  enabled: false,
  total: 0,
  remaining: 0,
};

function authErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  return String((error as { code?: unknown }).code ?? "");
}

function authErrorStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error))
    return undefined;
  const value = (error as { status?: unknown }).status;
  return typeof value === "number" ? value : undefined;
}

function logAuthError(scope: string, error: unknown) {
  console.error("[auth:mfa]", scope, {
    code: authErrorCode(error) || "unknown",
    status: authErrorStatus(error),
  });
}

function recoveryFeatureUnavailable(error: unknown) {
  const code = authErrorCode(error);
  return (
    (code.includes("mfa_recovery_codes_") && code.endsWith("_not_enabled")) ||
    code === "not_implemented" ||
    // Hosted Auth versions without this experimental endpoint return this pair.
    // Do not treat authorization, rate-limit or transient provider errors as absence.
    (code === "validation_failed" && authErrorStatus(error) === 404)
  );
}

async function signedInClient() {
  const user = await currentUser();
  if (!user || !user.email_confirmed_at) return null;
  return { user, supabase: await createClient() };
}

export async function readMfaSecurityState(): Promise<MfaSecurityState> {
  const context = await signedInClient();
  if (!context)
    return {
      enabled: false,
      factors: [],
      currentLevel: null,
      nextLevel: null,
      recoveryCodes: emptyRecoveryState,
    };

  const [factors, assurance] = await Promise.all([
    context.supabase.auth.mfa.listFactors(),
    context.supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (factors.error || assurance.error) throw new Error(unavailable);

  const verifiedFactors = factors.data.totp.filter(
    (factor) => factor.status === "verified",
  );
  const recoveryCodes = {
    ...emptyRecoveryState,
    available: process.env.SUPABASE_RECOVERY_CODES_ENABLED === "true",
  };

  if (verifiedFactors.length > 0 && recoveryCodes.available) {
    try {
      const status = await context.supabase.auth.mfa.recoveryCodes.getStatus();
      if (!status.error) {
        recoveryCodes.enabled = true;
        recoveryCodes.total = status.data.total;
        recoveryCodes.remaining = status.data.remaining;
      } else {
        const code = authErrorCode(status.error);
        if (code === "mfa_factor_not_found") {
          recoveryCodes.enabled = false;
        } else if (recoveryFeatureUnavailable(status.error)) {
          recoveryCodes.available = false;
        } else {
          logAuthError("recovery-status", status.error);
          recoveryCodes.available = false;
        }
      }
    } catch (error) {
      logAuthError("recovery-status", error);
      recoveryCodes.available = false;
    }
  }

  const session = await context.supabase.rpc("get_current_session");
  if (session.error) throw new Error(unavailable);
  const metadata = session.data as { created_at?: string } | null;
  return {
    enabled: verifiedFactors.length > 0,
    currentSession: metadata?.created_at
      ? { createdAt: metadata.created_at }
      : null,
    pendingFactors: factors.data.all
      .filter((f) => f.factor_type === "totp" && f.status === "unverified")
      .map((f) => ({
        id: f.id,
        friendlyName: f.friendly_name ?? "AgroMind Authenticator",
      })),
    factors: verifiedFactors.map((factor) => ({
      id: factor.id,
      friendlyName: factor.friendly_name ?? "AgroMind Authenticator",
    })),
    currentLevel: assurance.data.currentLevel,
    nextLevel: assurance.data.nextLevel,
    recoveryCodes,
  };
}

export async function beginTotpEnrollmentAction(
  form: FormData,
): Promise<
  { error: string } | { factorId: string; qrCode: string; secret: string }
> {
  const context = await signedInClient();
  if (!context)
    return { error: "Sign in again to manage two-step verification." };

  try {
    const proofError = await verifyFreshIdentity(
      context.supabase,
      context.user,
      form,
    );
    if (proofError) return { error: proofError };
    const factors = await context.supabase.auth.mfa.listFactors();
    if (factors.error) {
      logAuthError("list-before-enroll", factors.error);
      return { error: unavailable };
    }
    const verifiedFactors = factors.data.totp.filter(
      (factor) => factor.status === "verified",
    );
    if (verifiedFactors.length >= 2)
      return {
        error:
          "You already have two authenticators. Remove one before adding another.",
      };

    for (const factor of factors.data.all.filter(
      (factor) =>
        factor.factor_type === "totp" && factor.status === "unverified",
    )) {
      const removed = await context.supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });
      if (removed.error) return { error: unavailable };
    }

    const preferredName =
      verifiedFactors.length > 0
        ? "AgroMind Backup Authenticator"
        : "AgroMind Authenticator";
    const takenNames = new Set(
      verifiedFactors
        .map((factor) => factor.friendly_name?.trim())
        .filter((name): name is string => Boolean(name)),
    );
    let friendlyName = preferredName;
    let suffix = 2;
    while (takenNames.has(friendlyName)) {
      friendlyName = `${preferredName} ${suffix}`;
      suffix += 1;
    }

    const enrolled = await context.supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName,
    });
    if (enrolled.error) {
      logAuthError("totp-enroll", enrolled.error);
      if (authErrorCode(enrolled.error) === "mfa_totp_enroll_not_enabled")
        return {
          error: "Authenticator enrollment is not enabled for this project.",
        };
      if (authErrorCode(enrolled.error) === "mfa_factor_name_conflict")
        return {
          error:
            "A backup authenticator already exists. Refresh the page and try again.",
        };
      return {
        error: "Authenticator setup could not be started. Please try again.",
      };
    }

    const totp = enrolled.data.type === "totp" ? enrolled.data.totp : null;
    if (!totp?.qr_code || !totp.secret) {
      await context.supabase.auth.mfa.unenroll({ factorId: enrolled.data.id });
      console.error("[auth:mfa] totp-enroll-invalid-response", {
        type: enrolled.data.type,
        hasTotp: Boolean(totp),
      });
      return {
        error: "Authenticator setup could not be started. Please try again.",
      };
    }

    return {
      factorId: enrolled.data.id,
      qrCode: totp.qr_code,
      secret: totp.secret,
    };
  } catch (error) {
    logAuthError("totp-enroll-exception", error);
    return {
      error: "Authenticator setup could not be started. Please try again.",
    };
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
  if (!context)
    return { error: "Sign in again to manage two-step verification." };

  try {
    const factors = await context.supabase.auth.mfa.listFactors();
    if (
      factors.error ||
      !factors.data.all.some(
        (f) =>
          f.id === factorId &&
          f.factor_type === "totp" &&
          f.status === "unverified",
      )
    )
      return {
        error: "For security, restart authenticator setup and try again.",
      };
    if (factors.data.all.some((f) => f.status === "verified")) {
      const assurance =
        await context.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error || assurance.data.currentLevel !== "aal2")
        return { error: unavailable };
    }
    const verified = await context.supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    if (verified.error) {
      logAuthError("totp-verify-enrollment", verified.error);
      const errorCode = authErrorCode(verified.error);
      if (errorCode === "mfa_ip_address_mismatch")
        return {
          error: "For security, restart authenticator setup and try again.",
        };
      return {
        error:
          "That code is not valid. Try the newest code from your authenticator app.",
      };
    }

    revalidatePath("/account/security");
    revalidatePath("/", "layout");
    return { success: "Two-step verification is enabled." };
  } catch (error) {
    logAuthError("totp-verify-enrollment-exception", error);
    return { error: unavailable };
  }
}

export async function generateRecoveryCodesAction(
  form: FormData,
): Promise<RecoveryCodesResult> {
  if (process.env.SUPABASE_RECOVERY_CODES_ENABLED !== "true")
    return { error: "Backup codes are not available for this project yet." };
  const context = await signedInClient();
  if (!context)
    return { error: "Sign in again to manage two-step verification." };

  try {
    const proofError = await verifyFreshIdentity(
      context.supabase,
      context.user,
      form,
    );
    if (proofError) return { error: proofError };
    const [factors, assurance] = await Promise.all([
      context.supabase.auth.mfa.listFactors(),
      context.supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (factors.error || assurance.error) return { error: unavailable };
    if (!factors.data.totp.some((factor) => factor.status === "verified"))
      return { error: "Enable an authenticator before creating backup codes." };
    if (assurance.data.currentLevel !== "aal2")
      return {
        error: "Confirm your authenticator first to manage backup codes.",
      };

    const status = await context.supabase.auth.mfa.recoveryCodes.getStatus();
    if (!status.error)
      return { error: "Backup codes already exist. Regenerate them instead." };
    const statusCode = authErrorCode(status.error);
    if (recoveryFeatureUnavailable(status.error))
      return { error: "Backup codes are not available for this project yet." };
    if (statusCode !== "mfa_factor_not_found") {
      logAuthError("recovery-status-before-generate", status.error);
      return { error: unavailable };
    }

    const generated = await context.supabase.auth.mfa.recoveryCodes.generate({
      friendlyName: "AgroMind Backup Codes",
    });
    if (generated.error) {
      logAuthError("recovery-generate", generated.error);
      if (recoveryFeatureUnavailable(generated.error))
        return {
          error: "Backup codes are not available for this project yet.",
        };
      return { error: unavailable };
    }

    revalidatePath("/account/security");
    return { codes: generated.data.codes, total: generated.data.total };
  } catch (error) {
    logAuthError("recovery-generate-exception", error);
    return { error: "Backup codes are not available for this project yet." };
  }
}

export async function regenerateRecoveryCodesAction(
  form: FormData,
): Promise<RecoveryCodesResult> {
  if (process.env.SUPABASE_RECOVERY_CODES_ENABLED !== "true")
    return { error: "Backup codes are not available for this project yet." };
  const context = await signedInClient();
  if (!context)
    return { error: "Sign in again to manage two-step verification." };

  try {
    const proofError = await verifyFreshIdentity(
      context.supabase,
      context.user,
      form,
    );
    if (proofError) return { error: proofError };
    const assurance =
      await context.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) return { error: unavailable };
    if (assurance.data.currentLevel !== "aal2")
      return {
        error: "Confirm your authenticator first to manage backup codes.",
      };

    const regenerated =
      await context.supabase.auth.mfa.recoveryCodes.regenerate();
    if (regenerated.error) {
      logAuthError("recovery-regenerate", regenerated.error);
      if (recoveryFeatureUnavailable(regenerated.error))
        return {
          error: "Backup codes are not available for this project yet.",
        };
      return { error: unavailable };
    }

    revalidatePath("/account/security");
    return { codes: regenerated.data.codes, total: regenerated.data.total };
  } catch (error) {
    logAuthError("recovery-regenerate-exception", error);
    return { error: "Backup codes are not available for this project yet." };
  }
}

export async function disableTotpAction(
  _state: MfaActionState,
  form: FormData,
): Promise<MfaActionState> {
  const factorId = String(form.get("factor_id") ?? "");
  const context = await signedInClient();
  if (!context)
    return { error: "Sign in again to manage two-step verification." };

  try {
    const [factors, assurance] = await Promise.all([
      context.supabase.auth.mfa.listFactors(),
      context.supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (factors.error || assurance.error) return { error: unavailable };
    if (assurance.data.currentLevel !== "aal2")
      return {
        error:
          "Confirm your authenticator code before disabling two-step verification.",
      };

    const factor = factors.data.totp.find(
      (candidate) =>
        candidate.id === factorId && candidate.status === "verified",
    );
    if (!factor)
      return {
        error: "No authenticator factor is available for this account.",
      };

    const proofError = await verifyFreshIdentity(
      context.supabase,
      context.user,
      form,
    );
    if (proofError) return { error: proofError };
    const verifiedFactors = factors.data.totp.filter(
      (f) => f.status === "verified",
    );
    const removeOnly = form.get("remove_only") === "true";
    const targets = removeOnly ? [factor] : verifiedFactors;
    // Preserve recovery codes while another authenticator remains enabled.
    if (!removeOnly || verifiedFactors.length === 1)
      try {
        const status =
          await context.supabase.auth.mfa.recoveryCodes.getStatus();
        if (!status.error) {
          const recoveryRemoved =
            await context.supabase.auth.mfa.recoveryCodes.unenroll();
          if (recoveryRemoved.error) {
            logAuthError(
              "recovery-unenroll-before-totp",
              recoveryRemoved.error,
            );
            return { error: unavailable };
          }
        } else {
          const statusCode = authErrorCode(status.error);
          if (
            statusCode !== "mfa_factor_not_found" &&
            !recoveryFeatureUnavailable(status.error)
          ) {
            logAuthError("recovery-status-before-totp-unenroll", status.error);
            return { error: unavailable };
          }
        }
      } catch (error) {
        if (!recoveryFeatureUnavailable(error)) {
          logAuthError("recovery-cleanup-before-totp-unenroll", error);
          return { error: unavailable };
        }
      }

    for (const target of targets) {
      const removed = await context.supabase.auth.mfa.unenroll({
        factorId: target.id,
      });
      if (removed.error) {
        logAuthError("totp-unenroll", removed.error);
        revalidatePath("/account/security");
        return {
          error:
            "Two-step verification could not be disabled. Please try again.",
        };
      }
    }

    await context.supabase.auth.refreshSession();
    revalidatePath("/account/security");
    revalidatePath("/", "layout");
    return {
      success:
        removeOnly && verifiedFactors.length > 1
          ? "Authenticator removed. Your other authenticator remains active."
          : "Two-step verification is disabled.",
    };
  } catch (error) {
    logAuthError("totp-unenroll-exception", error);
    return { error: unavailable };
  }
}

export async function verifyMfaChallengeAction(
  _state: MfaActionState,
  form: FormData,
): Promise<MfaActionState> {
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  const destination = safeMfaNextPath(form.get("next"));
  if (!codePattern.test(code))
    return { error: "Enter the 6-digit code from your authenticator app." };

  const context = await signedInClient();
  if (!context) redirect(`/sign-in?next=${encodeURIComponent(destination)}`);

  try {
    const factors = await context.supabase.auth.mfa.listFactors();
    if (factors.error) return { error: unavailable };
    const factor = factors.data.totp.find(
      (candidate) =>
        candidate.status === "verified" &&
        candidate.id === String(form.get("factor_id") ?? ""),
    );
    if (!factor)
      return {
        error: "No authenticator factor is available for this account.",
      };

    const verified = await context.supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    });
    if (verified.error) {
      logAuthError("totp-challenge", verified.error);
      return {
        error:
          "That code is not valid. Try the newest code from your authenticator app.",
      };
    }
  } catch (error) {
    logAuthError("totp-challenge-exception", error);
    return { error: unavailable };
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function verifyRecoveryCodeAction(
  _state: MfaActionState,
  form: FormData,
): Promise<MfaActionState> {
  if (process.env.SUPABASE_RECOVERY_CODES_ENABLED !== "true")
    return { error: "Backup-code sign-in is not available right now." };
  const code = String(form.get("recovery_code") ?? "").trim();
  const destination = safeMfaNextPath(form.get("next"));
  if (code.length < 8 || code.length > 128)
    return { error: "Enter one of your backup codes." };

  const context = await signedInClient();
  if (!context) redirect(`/sign-in?next=${encodeURIComponent(destination)}`);

  try {
    const verified = await context.supabase.auth.mfa.recoveryCodes.verify({
      code,
    });
    if (verified.error) {
      logAuthError("recovery-verify", verified.error);
      const errorCode = authErrorCode(verified.error);
      if (errorCode === "mfa_recovery_codes_locked")
        return {
          error:
            "Too many failed backup-code attempts. Please wait and try again.",
        };
      if (recoveryFeatureUnavailable(verified.error))
        return { error: "Backup-code sign-in is not available right now." };
      return { error: "That backup code is invalid or has already been used." };
    }
  } catch (error) {
    logAuthError("recovery-verify-exception", error);
    return { error: "Backup-code sign-in is not available right now." };
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function cancelTotpEnrollmentAction(
  factorId: string,
): Promise<MfaActionState> {
  const context = await signedInClient();
  if (!context) return { error: unavailable };
  try {
    const factors = await context.supabase.auth.mfa.listFactors();
    if (factors.error) return { error: unavailable };
    const factor = factors.data.all.find(
      (f) => f.id === factorId && f.factor_type === "totp",
    );
    if (!factor) return { success: "Incomplete setup removed." };
    if (factor.status !== "unverified") return { error: unavailable };
    const removed = await context.supabase.auth.mfa.unenroll({ factorId });
    if (removed.error) return { error: unavailable };
    revalidatePath("/account/security");
    return { success: "Incomplete setup removed." };
  } catch {
    return { error: unavailable };
  }
}

export async function signOutSessionsAction(
  _state: MfaActionState,
  form: FormData,
): Promise<MfaActionState> {
  const scope = form.get("scope");
  if (scope !== "global" && scope !== "others") return { error: unavailable };
  const context = await signedInClient();
  if (!context) return { error: unavailable };
  try {
    const proofError = await verifyFreshIdentity(
      context.supabase,
      context.user,
      form,
    );
    if (proofError) return { error: proofError };
    const result = await context.supabase.auth.signOut({ scope });
    if (result.error) return { error: unavailable };
  } catch {
    return { error: unavailable };
  }
  revalidatePath("/", "layout");
  if (scope === "global") redirect("/sign-in");
  return { success: "Other sessions have been signed out." };
}
