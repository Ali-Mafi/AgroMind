import { requireSupportStaff } from "@/features/support/services/data";
import { readMfaSecurityState } from "@/features/authentication/services/mfa-actions";
import { MfaChallenge } from "@/features/authentication/components/mfa-challenge";
import { AuthShell } from "@/features/authentication/components/auth-shell";
export default async function Page() {
  await requireSupportStaff();
  const state = await readMfaSecurityState();
  return (
    <AuthShell
      title="Two-step verification"
      description="Confirm your identity with the code from your authenticator app."
    >
      <MfaChallenge next="/admin/support" factors={state.factors} />
    </AuthShell>
  );
}
