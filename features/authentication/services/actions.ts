"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
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

async function signInWithUsername(username: string, password: string) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/functions/v1/username-login`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      apikey: key,
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ username, password }),
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
  if (session.error || !session.data.user) return { error: "invalid_credentials" } as const;
  return { user: session.data.user } as const;
}

export async function signUpAction(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
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
          full_name: parsed.data.username,
          language: parsed.data.language,
          verification_watch_hash: watch.hash,
        },
      },
    });

    const duplicate =
      ["user_already_exists", "email_exists"].includes(error?.code ?? "") ||
      Boolean(data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);
    if (duplicate) return { error: "This account already exists. Sign in instead." };

    if (error) {
      return {
        error:
          error.status === 429
            ? "Too many attempts. Please wait before trying again."
            : error.message.toLowerCase().includes("username")
              ? "Username is already taken."
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
          error:
            result.error?.status === 429
              ? "Too many attempts. Please wait before trying again."
              : result.error?.code === "email_not_confirmed"
                ? "Your email is not verified yet. Check the verification email from sign up."
                : "Email or password is incorrect.",
        };
      }
    } else {
      const result = await signInWithUsername(identifier, parsed.data.password);
      if ("error" in result) {
        return {
          error:
            result.error === "email_not_confirmed"
              ? "Your email is not verified yet. Check the verification email from sign up."
              : "Email or password is incorrect.",
        };
      }
      userId = result.user.id;
    }

    const profile = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .single();
    if (profile.error) return unavailable;
    if (profile.data.onboarding_completed) destination = safeNextPath(form.get("next"));
    await clearPendingSignup();
  } catch {
    return unavailable;
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function requestPasswordResetAction(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) return { fields: { email: "Enter a valid email address." } };
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
  state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  void state;
  void form;
  const pending = await readPendingSignup();
  if (!pending) return { error: "Verification is available after you create an account." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pending.email,
      options: { emailRedirectTo: `${siteOrigin()}/auth/callback` },
    });
    if (error?.status === 429)
      return { error: "Too many attempts. Please wait before trying again." };
    if (error) return unavailable;
    return { success: "Verification email sent. Check your inbox and spam folder." };
  } catch {
    return unavailable;
  }
}

export async function pendingVerificationStatusAction(): Promise<{ verified: boolean }> {
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
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: hash.data, type });
    if (error)
      return {
        error:
          error.code === "otp_expired"
            ? "This link has expired or was already used. Request a new email."
            : "This link is invalid. Request a new email.",
      };
    if (type === "signup") await supabase.auth.signOut({ scope: "local" });
  } catch {
    return unavailable;
  }
  revalidatePath("/", "layout");
  redirect(type === "recovery" ? "/reset-password" : "/verify-email?status=success");
}

export async function resetPasswordAction(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationState(parsed.error);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
      return { error: "Your session has expired. Request a new password reset email." };
    if (data.user.id !== form.get("expected_user_id"))
      return { error: "Your account changed. Reload before saving." };
    const updated = await supabase.auth.updateUser({ password: parsed.data.password });
    if (updated.error)
      return {
        error:
          updated.error.code === "same_password"
            ? "Choose a password different from your current password."
            : unavailable.error,
      };
    const signedOut = await supabase.auth.signOut({ scope: "global" });
    if (signedOut.error)
      return { success: "Password updated. Sign out from your account before signing in again." };
  } catch {
    return unavailable;
  }
  revalidatePath("/", "layout");
  redirect("/sign-in?status=password-updated");
}

export async function logoutAction(): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return unavailable;
    revalidatePath("/", "layout");
    return {};
  } catch {
    return unavailable;
  }
}
