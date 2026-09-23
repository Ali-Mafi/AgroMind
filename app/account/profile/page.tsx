import { ProfileForm } from "@/features/account/components/profile-form";
import { readMfaSecurityState } from "@/features/authentication/services/mfa-actions";

export default async function Page() {
  const securityState = await readMfaSecurityState();
  return <ProfileForm securityState={securityState} />;
}

export const dynamic = "force-dynamic";
