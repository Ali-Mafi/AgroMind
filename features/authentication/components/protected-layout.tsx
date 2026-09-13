import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { FarmProvider } from "@/features/farms/context/farm-context";
import { readCloudSnapshot } from "@/features/cloud/services/data";
import { LegacyMigration } from "@/features/cloud/components/legacy-migration";
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
      <LegacyMigration />
      {children}
    </FarmProvider>
  );
}
