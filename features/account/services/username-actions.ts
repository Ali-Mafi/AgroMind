"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { usernameSchema } from "@/features/authentication/lib/validation";
import { verifyFreshIdentity } from "@/features/authentication/services/fresh-auth";
import { currentUser } from "@/features/authentication/services/session";

export type UsernameActionState = {
  error?: string;
  success?: string;
  fields?: { username?: string };
};

const unavailable =
  "Account services are temporarily unavailable. Please try again.";

function usernameTaken(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "23505" ||
    error?.message?.includes("USERNAME_TAKEN") === true
  );
}

export async function updateUsernameAction(
  _state: UsernameActionState,
  form: FormData,
): Promise<UsernameActionState> {
  const parsed = usernameSchema.safeParse(form.get("username"));
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fields: { username: parsed.error.issues[0]?.message ?? "Please check this field." },
    };
  }

  try {
    const user = await currentUser();
    if (!user?.email_confirmed_at) {
      return { error: "Sign in again before changing your username." };
    }

    const supabase = await createClient();
    const current = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (current.error) return { error: unavailable };
    if (current.data.username === parsed.data) {
      return { success: "Username is already set to this value." };
    }

    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error) return { error: unavailable };
    if (!factors.data.totp.some((factor) => factor.status === "verified")) {
      return {
        error:
          "Enable two-step verification before setting or changing your username.",
      };
    }

    const available = await supabase.rpc(
      "username_available" as never,
      { p_username: parsed.data } as never,
    );
    if (available.error) return { error: unavailable };
    if (available.data !== true) {
      return {
        error: "This username is already taken.",
        fields: { username: "This username is already taken." },
      };
    }

    const proofError = await verifyFreshIdentity(supabase, user, form);
    if (proofError) {
      return {
        error:
          "Enter a fresh code from your authenticator to change your username.",
      };
    }

    const changed = await supabase.rpc(
      "change_username" as never,
      { p_username: parsed.data } as never,
    );
    if (changed.error) {
      if (usernameTaken(changed.error)) {
        return {
          error: "This username is already taken.",
          fields: { username: "This username is already taken." },
        };
      }
      if (changed.error.message.includes("MFA_REQUIRED")) {
        return {
          error:
            "Enable two-step verification before setting or changing your username.",
        };
      }
      if (changed.error.message.includes("MFA_CHALLENGE_REQUIRED")) {
        return {
          error:
            "Enter a fresh code from your authenticator to change your username.",
        };
      }
      return { error: unavailable };
    }

    revalidatePath("/account/profile");
    revalidatePath("/", "layout");
    return {
      success: current.data.username
        ? "Username changed."
        : "Username set.",
    };
  } catch {
    return { error: unavailable };
  }
}
