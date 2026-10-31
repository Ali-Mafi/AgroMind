import { readSecuritySnapshot } from "@/features/account-security/services/server";
import { SecurityCenter } from "@/features/account/components/security-center";
import { readMfaSecurityState } from "@/features/authentication/services/mfa-actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [mfa, sessions] = await Promise.all([readMfaSecurityState(), readSecuritySnapshot().catch(() => null)]);
  return <SecurityCenter initialState={mfa} sessionSnapshot={sessions} sessionError={!sessions} />;
}
