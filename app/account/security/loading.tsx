import { AccountShell, accountCardClass } from "@/features/account/components/account-shell";
import { T } from "@/features/settings/components/translated-text";

export default function Loading() {
  return <AccountShell title="Security"><section className={accountCardClass} aria-busy="true"><p role="status"><T text="Please wait…" /></p></section></AccountShell>;
}
