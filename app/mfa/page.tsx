import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { T } from "@/features/settings/components/translated-text";
import { supabaseConfig } from "@/lib/supabase/config";
import {
  pendingMfaCancellationCookie,
  sessionCookieName,
} from "@/lib/supabase/session-cookies";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { MfaChallenge } from "@/features/authentication/components/mfa-challenge";
import { safeMfaNextPath } from "@/features/authentication/lib/redirects";
import { readMfaSecurityState } from "@/features/authentication/services/mfa-actions";
import { currentUser } from "@/features/authentication/services/session";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const destination = safeMfaNextPath(params.next);
  const user = await currentUser();

  if (!user) redirect(`/sign-in?next=${encodeURIComponent(destination)}`);
  if (!user.email_confirmed_at) redirect("/verify-email");

  const state = await readMfaSecurityState();
  if (!state.enabled || state.currentLevel === "aal2") redirect(destination);

  const { url } = supabaseConfig();
  const cancellation = await pendingMfaCancellationCookie(
    (await cookies()).getAll(),
    sessionCookieName(url),
  );
  const cancelFormId = "mfa-cancel";

  return (
    <AuthShell
      title="Two-step verification"
      description="Confirm your identity with the code from your authenticator app."
      backForm={cancelFormId}
    >
      <MfaChallenge
        next={destination}
        factors={state.factors}
        recoveryCodesEnabled={state.recoveryCodes.enabled}
      />
      <form id={cancelFormId} method="post" action="/mfa/cancel" className="mt-4">
        <input type="hidden" name="attempt" value={cancellation ?? ""} />
        <Button
          type="submit"
          variant="outline"
          className="min-h-11 w-full whitespace-normal rounded-xl"
        >
          {destination === "/reset-password" ? (
            <T text="Cancel password reset" />
          ) : (
            <T text="Cancel sign-in or use another account" />
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
