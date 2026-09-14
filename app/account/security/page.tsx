import { SecurityCenter } from "@/features/account/components/security-center";
import { readMfaSecurityState } from "@/features/authentication/services/mfa-actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <SecurityCenter initialState={await readMfaSecurityState()} />;
}
