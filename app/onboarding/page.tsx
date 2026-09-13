import { Onboarding } from "@/features/account/components/onboarding";
import { readCloudSnapshot } from "@/features/cloud/services/data";
import { redirect } from "next/navigation";
export default async function Page() {
  if ((await readCloudSnapshot()).profile.onboarding_completed)
    redirect("/dashboard");
  return <Onboarding />;
}
