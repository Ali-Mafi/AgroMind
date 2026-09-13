"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

const unavailable = {
  error: "Account services are temporarily unavailable. Please try again.",
};
const genericEmail = {
  success:
    "If an account matches this email, a message will arrive shortly. Check your inbox and spam folder.",
};

export async function signUpAction(
  _: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationState(parsed.error);
  if (form.get("website")) return genericEmail;
  try {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${siteOrigin()}/auth/callback`,
        data: {
          full_name: parsed.data.fullName,
          language: parsed.data.language,
        },
      },
    });
    if (
      error &&
      !["user_already_exists", "email_exists"].includes(error.code ?? "")
    ) {
      return {
        error:
          error.status === 429
            ? "Too many attempts. Please wait before trying again."
            : unavailable.error,
      };
    }
    if (data.session) {
      await supabase.auth.signOut({ scope: "local" });
      return unavailable;
    }
  } catch {
    return unavailable;
  }
  redirect("/verify-email?status=pending");
}
export async function signInAction(
  _: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationState(parsed.error);
  let destination = "/onboarding";
  try {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user)
      return {
        error:
          error?.status === 429
            ? "Too many attempts. Please wait before trying again."
            : "Email or password is incorrect, or your email needs verification.",
      };
    const profile = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", data.user.id)
      .single();
    if (profile.error) return unavailable;
    if (profile.data.onboarding_completed)
      destination = safeNextPath(form.get("next"));
  } catch {
    return unavailable;
  }
  revalidatePath("/", "layout");
  redirect(destination);
}
export async function requestPasswordResetAction(
  _: AuthFormState,
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
    // Identical responses also cover provider failures: delivery only runs for
    // existing accounts, so surfacing those failures would reveal membership.
    return genericEmail;
  } catch {
    return genericEmail;
  }
}
export async function resendVerificationAction(
  _: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success)
    return { fields: { email: "Enter a valid email address." } };
  if (form.get("website")) return genericEmail;
  try {
    const supabase = await createClient();
    await supabase.auth.resend({
      type: "signup",
      email: parsed.data,
      options: { emailRedirectTo: `${siteOrigin()}/auth/callback` },
    });
    return genericEmail;
  } catch {
    return genericEmail;
  }
}
export async function verifyEmailAction(
  _: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const hash = tokenHashSchema.safeParse(form.get("token_hash"));
  const type = form.get("type") === "recovery" ? "recovery" : "signup";
  if (!hash.success)
    return { error: "This link is invalid. Request a new email." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: hash.data,
      type,
    });
    if (error)
      return {
        error:
          error.code === "otp_expired"
            ? "This link has expired or was already used. Request a new email."
            : "This link is invalid. Request a new email.",
      };
  } catch {
    return unavailable;
  }
  revalidatePath("/", "layout");
  redirect(
    type === "recovery" ? "/reset-password" : "/verify-email?status=success",
  );
}
export async function resetPasswordAction(
  _: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationState(parsed.error);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
      return {
        error: "Your session has expired. Request a new password reset email.",
      };
    if (data.user.id !== form.get("expected_user_id"))
      return { error: "Your account changed. Reload before saving." };
    const updated = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (updated.error)
      return {
        error:
          updated.error.code === "same_password"
            ? "Choose a password different from your current password."
            : unavailable.error,
      };
    const signedOut = await supabase.auth.signOut({ scope: "global" });
    if (signedOut.error)
      return {
        success:
          "Password updated. Sign out from your account before signing in again.",
      };
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
