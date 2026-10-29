"use server";

import { observeLogin } from "@/features/account-security/services/login";
import { recordSecurityEvent, securityContext } from "@/features/account-security/services/server";
import { authorizeCredentialAction, credentialPayloadHash, requireSecurityOrigin } from "@/features/account-security/services/action-proof";
import { issueRecoveryAuthorization, recoveryAuthorization, clearRecoveryAuthorization } from "./recovery-authorization";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { REVIEWED_ON, TERMS_REQUIRED_MESSAGE } from "@/features/legal/content";
import {
  emailSchema,
  resetSchema,
  signInSchema,
  signUpSchema,
  tokenHashSchema,
  validationState,
  type AuthFormState,
} from "../lib/validation";
import { safeNextPath, siteOrigin } from "../lib/redirects";
import {
  clearPendingSignup,
  createVerificationWatch,
  hashVerificationWatch,
  readPendingSignup,
  rememberPendingSignup,
} from "../lib/pending-signup";

const unavailable = {
  error: "Account services are temporarily unavailable. Please try again.",
};
const genericEmail = {
  success:
    "If an account matches this email, a message will arrive shortly. Check your inbox and spam folder.",
};

async function usernameAvailable(username: string) {
  const supabase = await createClient();
  const result = await supabase.rpc(
    "username_available" as never,
    { p_username: username } as never,
  );
  if (result.error) throw result.error;
  return result.data === true;
}

async function signInWithUsername(
  username: string,
  password: string,
  captchaToken: string,
) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/functions/v1/username-login`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      apikey: key,
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      username,
      password,
      captcha_token: captchaToken.slice(0, 2048),
    }),
    signal: AbortSignal.timeout(15000),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
  };
  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    return { error: payload.error ?? "invalid_credentials" } as const;
  }
  const supabase = await createClient();
  const session = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });
  if (session.error || !session.data.user)
    return { error: "invalid_credentials" } as const;
  return { user: session.data.user } as const;
}

export async function signUpAction(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  // Reject forged or unchecked requests before any account/provider operations.
  if (form.get("accepted_terms") !== "on") {
    return { error: "Please check the highlighted fields.", fields: {
      accepted_terms: TERMS_REQUIRED_MESSAGE,
    } };
  }
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationState(parsed.error);
  if (form.get("website")) return genericEmail;

  try {
    if (!(await usernameAvailable(parsed.data.username))) {
      return { fields: { username: "Username is already taken." } };
    }

    const watch = createVerificationWatch();
    const supabase = await createClient();
    const { error, data } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${siteOrigin()}/auth/callback`,
        data: {
          username: parsed.data.username,
          language: parsed.data.language,
          verification_watch_hash: watch.hash,
          terms_accepted_version: REVIEWED_ON,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    });

    const duplicate =
      ["user_already_exists", "email_exists"].includes(error?.code ?? "") ||
      Boolean(
        data.user &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0,
      );
    if (duplicate)
      return {
        error: "This account already exists. Sign in instead.",
        fields: { email: "This account already exists. Sign in instead." },
      };

    if (error) {
      if (
        error.status !== 429 &&
        error.message.toLowerCase().includes("username")
      ) {
        return { fields: { username: "Username is already taken." } };
      }
      return {
        error:
          error.status === 429
            ? "Too many attempts. Please wait before trying again."
            : unavailable.error,
      };
    }

    // Email confirmation is part of the product security model. If a hosted
    // setting accidentally disables it, fail closed rather than silently
    // creating an authenticated session that skips verification.
    if (data.session) {
      await supabase.auth.signOut({ scope: "local" });
      return unavailable;
    }
    if (!data.user) return unavailable;

    await rememberPendingSignup({
      email: parsed.data.email,
      username: parsed.data.username,
      watchToken: watch.token,
      next: safeNextPath(form.get("next")),
    });
  } catch {
    return unavailable;
  }

  redirect("/verify-email?status=pending");
}

export async function signInAction(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationState(parsed.error);

  let destination = "/onboarding";
  let mfaDestination: string | null = null;
  try {
    const identifier = parsed.data.identifier;
    const supabase = await createClient();
    let userId: string | undefined;

    if (identifier.includes("@")) {
      const result = await supabase.auth.signInWithPassword({
        email: identifier,
        password: parsed.data.password,
      });
      userId = result.data.user?.id;
      if (result.error || !userId) {
        return {
          verificationRequired: result.error?.code === "email_not_confirmed",
          error:
            result.error?.status === 429
              ? "Too many attempts. Please wait before trying again."
              : result.error?.code === "email_not_confirmed"
                ? "Your email is not verified yet. Check the verification email from sign up."
                : "Email or password is incorrect.",
        };
      }
    } else {
      const result = await signInWithUsername(
        identifier,
        parsed.data.password,
        String(form.get("captcha_token") ?? ""),
      );
      if ("error" in result) {
        return {
          verificationRequired: result.error === "email_not_confirmed",
          error:
            result.error === "too_many_attempts"
              ? "Too many attempts. Please wait before trying again."
              : result.error === "verification_required"
                ? "Complete the security verification and try again."
                : result.error === "email_not_confirmed"
                  ? "Your email is not verified yet. Check the verification email from sign up."
                  : "Email or password is incorrect.",
        };
      }
      userId = result.user.id;
    }

    await observeLogin("password");

    // RLS blocks protected cloud tables at aal1 after MFA is enrolled, so the
    // assurance check must happen before reading the profile.
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) return unavailable;
    if (
      assurance.data.nextLevel === "aal2" &&
      assurance.data.currentLevel !== "aal2"
    ) {
      mfaDestination = `/mfa?next=${encodeURIComponent(safeNextPath(form.get("next")))}`;
    } else {
      const safeNext = safeNextPath(form.get("next"));
      if (safeNext.startsWith("/invite/")) {
        destination = safeNext;
      } else {
        const profile = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", userId)
          .single();
        if (profile.error) return unavailable;
        if (profile.data.onboarding_completed) destination = safeNext;
      }
    }
    await clearPendingSignup();
  } catch {
    return unavailable;
  }

  revalidatePath("/", "layout");
  if (mfaDestination) redirect(mfaDestination);
  redirect(destination);
}

async function oauthRequestOrigin() {
  const requestHeaders = await headers();
  const forwardedHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto =
    requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!forwardedHost || forwardedProto !== "https")
    return siteOrigin();

  const host = forwardedHost.split(",")[0]?.trim().toLowerCase();
  if (!host) return siteOrigin();

  const productionHost =
    host === "agromind.ir" || host === "www.agromind.ir";
  const previewHost =
    process.env.VERCEL_ENV === "preview" &&
    /^agro-mind(?:-git)?-[a-z0-9-]+-ali-mafi\.vercel\.app$/.test(host);

  if (!productionHost && !previewHost) return siteOrigin();
  return `https://${host}`;
}

export async function signInWithGoogleAction(form: FormData): Promise<void> {
  const next = safeNextPath(form.get("next"));
  const source = form.get("source") === "signup" ? "signup" : "login";
  let providerUrl: string | null = null;

  try {
    const origin = await oauthRequestOrigin();
    const callback = new URL("/auth/callback", origin);

    const cookieStore = await cookies();
    cookieStore.set(
      "agromind_oauth_intent",
      encodeURIComponent(JSON.stringify({ next, source })),
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      },
    );

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        scopes: "openid email profile",
      },
    });

    if (!error && data.url) providerUrl = data.url;
  } catch {
    providerUrl = null;
  }

  if (!providerUrl) {
    const fallback = new URL(
      source === "signup" ? "/sign-up" : "/sign-in",
      siteOrigin(),
    );
    fallback.searchParams.set("status", "oauth-error");
    if (next !== "/dashboard") fallback.searchParams.set("next", next);
    redirect(fallback.toString());
  }

  redirect(providerUrl);
}

export async function requestPasswordResetAction(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success)
    return { fields: { email: "Enter a valid email address." } };
  if (form.get("website")) return genericEmail;
  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${siteOrigin()}/auth/callback?next=/reset-password`,
    });
    return genericEmail;
  } catch {
    return genericEmail;
  }
}

export async function resendVerificationAction(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  if (form.get("website")) return genericEmail;
  const pending = await readPendingSignup();
  const parsed = emailSchema.safeParse(form.get("email") ?? pending?.email);
  if (!parsed.success)
    return {
      error: "Enter a valid email address.",
      fields: { email: "Enter a valid email address." },
      verificationRequired: true,
    };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data.toLowerCase(),
      options: { emailRedirectTo: `${siteOrigin()}/auth/callback` },
    });
    if (error?.status === 429)
      return { error: "Too many attempts. Please wait before trying again." };
    if (
      error &&
      !["user_not_found", "email_exists", "email_already_confirmed"].includes(
        error.code ?? "",
      )
    )
      return unavailable;
    // The same response covers pending, confirmed and nonexistent addresses.
    return genericEmail;
  } catch {
    return unavailable;
  }
}

export async function changePendingSignupEmailAction(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const pending = await readPendingSignup();
  if (!pending) {
    return {
      error: "Verification is available after you create an account.",
      verificationRequired: true,
    };
  }

  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) {
    return {
      error: "Enter a valid email address.",
      fields: { email: "Enter a valid email address." },
      verificationRequired: true,
    };
  }

  const email = parsed.data.toLowerCase();
  try {
    const { url, key } = supabaseConfig();
    const response = await fetch(`${url}/functions/v1/change-pending-email`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        apikey: key,
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        token_hash: hashVerificationWatch(pending.watchToken),
        email,
        redirect_to: `${siteOrigin()}/auth/callback`,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      updated?: boolean;
      sent?: boolean;
      reason?: string;
      error?: string;
    };

    if (!response.ok || payload.error) {
      if (payload.error === "email_taken") {
        return {
          error: "This email is already in use.",
          fields: { email: "This email is already in use." },
          verificationRequired: true,
        };
      }
      if (payload.error === "pending_signup_expired") {
        return {
          error: "Your signup session has expired. Please create your account again.",
          verificationRequired: true,
        };
      }
      if (payload.error === "already_verified") {
        return {
          success: "Your email is already verified. Sign in to continue.",
        };
      }
      return unavailable;
    }

    if (payload.updated !== true) return unavailable;

    await rememberPendingSignup({ ...pending, email });

    if (payload.sent === true) {
      return {
        success: "Email updated. A new verification email was sent.",
      };
    }
    if (payload.reason === "rate_limited") {
      return {
        success:
          "Email updated. Please wait a moment, then resend the verification email.",
      };
    }
    return {
      success:
        "Email updated. Use resend verification email to send a new link.",
    };
  } catch {
    return unavailable;
  }
}

export async function pendingVerificationStatusAction(): Promise<{
  verified: boolean;
}> {
  const pending = await readPendingSignup();
  if (!pending) return { verified: false };
  try {
    const supabase = await createClient();
    const result = await supabase.rpc(
      "pending_signup_verified" as never,
      { p_token_hash: hashVerificationWatch(pending.watchToken) } as never,
    );
    return { verified: !result.error && result.data === true };
  } catch {
    return { verified: false };
  }
}

export async function verifyEmailAction(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const hash = tokenHashSchema.safeParse(form.get("token_hash"));
  const type = form.get("type") === "recovery" ? "recovery" : "signup";
  if (!hash.success) return { error: "This link is invalid. Request a new email." };
  try {
    await requireSecurityOrigin();
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: hash.data, type });
    if (error) return { error: error.code === "otp_expired"
      ? "This link has expired or was already used. Request a new email."
      : "This link is invalid. Request a new email." };
    if (type === "signup") await supabase.auth.signOut({ scope: "local" });
    else {
      if (!data.user || !data.session) return unavailable;
      const context = await securityContext(supabase);
      if (context.userId !== data.user.id) return unavailable;
      await issueRecoveryAuthorization(supabase);
      await observeLogin("recovery");
    }
  } catch { return unavailable; }
  revalidatePath("/", "layout");
  redirect(type === "recovery" ? "/reset-password" : "/verify-email?status=success");
}

export async function requestPasswordReauthenticationAction(): Promise<{ error?: string; success?: string }> {
  try {
    await requireSecurityOrigin();
    const supabase = await createClient();
    const context = await securityContext(supabase);
    // The quota is service-only and bound to the verified, currently active session.
    const reserved = await (await import("@/features/account-security/services/server")).securityWorker()
      .rpc("security_reserve_reauthentication", {
        p_user: context.userId, p_session: context.sessionId,
      });
    if (reserved.error || reserved.data !== true)
      return { error: "Please wait before requesting another verification email." };
    const sent = await supabase.auth.reauthenticate();
    if (sent.error) return unavailable;
    return { success: "Verification code sent. Check your email and enter the code below." };
  } catch {
    return unavailable;
  }
}

export async function resetPasswordAction(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationState(parsed.error);
  let status = "password-update-unknown";
  try {
    await requireSecurityOrigin();
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { error: "Your session has expired. Request a new password reset email." };
    if (data.user.id !== form.get("expected_user_id"))
      return { error: "Your account changed. Reload before saving." };
    const recoveryHash = await recoveryAuthorization(supabase);
    const recovery = form.get("password_context") === "recovery";
    if (recovery && !recoveryHash)
      return { error: "This link has expired or was already used. Request a new email." };
    const operation = recovery ? "password_recovery" : "password_change";
    const payloadHash = credentialPayloadHash(operation, parsed.data.password);
    const currentPassword = String(form.get("current_password") ?? "");
    const nonce = String(form.get("reauthentication_nonce") ?? "").trim();
    // Validate optional provider proofs before consuming an operation-specific grant.
    if (currentPassword.length > 128 || (nonce && !/^\\d{6}$/.test(nonce)))
      return { error: "Enter a valid verification code and current password." };
    let grant;
    try {
      grant = await authorizeCredentialAction(
        supabase, data.user, form, operation, payloadHash, recovery ? recoveryHash : null,
      );
    } catch {
      return { error: "Confirm your identity with a fresh code or your current password." };
    }

    // One transaction atomically consumes the fresh grant, snapshots all native
    // sessions, writes an audit intent, and denies AgroMind protected data.
    // An unconfirmed DB response never authorizes a native password mutation.
    let prepared;
    try {
      prepared = await grant.worker.rpc("security_prepare_password_change", {
        p_id: grant.id, p_user: data.user.id, p_session: grant.context.sessionId,
        p_operation: operation, p_payload_hash: payloadHash,
      });
    } catch {
      return { error: "Password change was not attempted. Your session may have been restricted; sign in again or use account recovery." };
    }
    if (prepared.error || prepared.data !== true)
      return { error: "Password change was not attempted. Your session may have been restricted; sign in again or use account recovery." };

    if (recovery) await clearRecoveryAuthorization().catch(() => { /* SQL already consumed the ticket. */ });
    // The native Auth endpoint has its own password/current-password/nonce
    // policy. Fresh app TOTP cannot bypass that provider policy.
    const updated = await supabase.auth.updateUser({
      password: parsed.data.password,
      ...(!recovery && currentPassword ? { current_password: currentPassword } : {}),
      ...(!recovery && nonce ? { nonce } : {}),
    }).catch(() => ({ error: { code: "request_timeout" } }));
    const confirmed = !updated.error;
    let recorded = false;
    if (confirmed) {
      const result = await grant.worker.rpc("security_password_changed", {
        p_id: grant.id, p_user: data.user.id, p_session: grant.context.sessionId,
      }).catch(() => ({ error: true }));
      recorded = !result.error;
    } else if (["same_password", "reauthentication_needed", "reauthentication_not_valid",
      "weak_password", "validation_failed", "invalid_credentials"].includes(updated.error?.code ?? "")) {
      // A definite provider rejection is distinct from a lost/ambiguous response.
      await grant.worker.rpc("security_password_update_rejected", {
        p_id: grant.id, p_user: data.user.id, p_session: grant.context.sessionId,
      }).catch(() => ({ error: true }));
    }
    // Always attempt native refresh-token revocation, even after a rejected
    // or ambiguous password update; app denial and audit intent persist.
    const signedOut = await supabase.auth.signOut({ scope: "global" })
      .catch(() => ({ error: true }));
    const finished = await grant.worker.rpc("security_finish_revocation", {
      p_id: grant.id, p_user: data.user.id, p_success: !signedOut.error,
    }).catch(() => ({ error: true, data: false }));
    status = confirmed
      ? (recorded && !finished.error && finished.data === true
        ? "password-updated" : "password-updated-pending")
      : "password-update-unknown";
  } catch {
    // No exception may turn an unknown or failed provider mutation into success.
    return unavailable;
  }
  revalidatePath("/", "layout");
  redirect(`/sign-in?status=${status}`);
}

export async function logoutAction(): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const context = await securityContext(supabase).catch(() => null);
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return unavailable;
    if (context) await recordSecurityEvent(context, "logout", context.sessionId);
    revalidatePath("/", "layout");
    return {};
  } catch {
    return unavailable;
  }
}
