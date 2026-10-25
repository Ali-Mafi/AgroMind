"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { REVIEWED_ON } from "@/features/legal/content";
import { safeNextPath } from "../lib/redirects";
import { needsGoogleTerms } from "../lib/terms-gate";
import { currentUser, needsSecondFactor } from "./session";

export type TermsActionState = { error?: "required" | "unavailable" };

export async function acceptGoogleTermsAction(
  _state: TermsActionState,
  form: FormData,
): Promise<TermsActionState> {
  if (form.get("accepted_terms") !== "on") return { error: "required" };
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!user.email_confirmed_at) redirect("/verify-email");
  if (await needsSecondFactor()) redirect("/mfa");

  if (needsGoogleTerms(user)) {
    try {
      const supabase = await createClient();
      const updated = await supabase.auth.updateUser({
        data: {
          terms_accepted_version: REVIEWED_ON,
          terms_accepted_at: new Date().toISOString(),
        },
      });
      if (updated.error || updated.data.user?.id !== user.id)
        return { error: "unavailable" };
    } catch {
      return { error: "unavailable" };
    }
  }

  // A new request re-reads the refreshed Supabase user; the usual protected
  // layout then checks onboarding and routes to /onboarding if needed.
  revalidatePath("/", "layout");
  redirect(safeNextPath(form.get("next")));
}

export async function declineGoogleTermsAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
