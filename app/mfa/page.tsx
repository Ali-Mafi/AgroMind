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

  return (
    <AuthShell
      title="Two-step verification"
      description="Confirm your identity with the code from your authenticator app."
    >
      <MfaChallenge
        next={destination}
        factors={state.factors}
        recoveryCodesEnabled={state.recoveryCodes.enabled}
      />
    </AuthShell>
  );
}
