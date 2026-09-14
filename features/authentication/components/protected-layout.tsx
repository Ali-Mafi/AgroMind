import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { FarmProvider } from "@/features/farms/context/farm-context";
import { readCloudSnapshot } from "@/features/cloud/services/data";
import { LegacyMigration } from "@/features/cloud/components/legacy-migration";
import { AccountPreferenceSync } from "@/features/settings/components/account-preference-sync";

export default async function ProtectedLayout({
  children,
  requireOnboarding = false,
}: {
  children: ReactNode;
  requireOnboarding?: boolean;
}) {
  const cloud = await readCloudSnapshot();
  if (requireOnboarding && !cloud.profile.onboarding_completed)
    redirect("/onboarding");

  return (
    <FarmProvider key={cloud.user.id} initialCloud={cloud}>
      <AccountPreferenceSync
        userId={cloud.user.id}
        profileCountry={cloud.profile.country_code}
        profileLanguage={cloud.profile.language}
      />
      <LegacyMigration />
      {children}
    </FarmProvider>
  );
}
