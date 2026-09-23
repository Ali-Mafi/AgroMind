import type { ReactNode } from "react";
import ProtectedLayout from "@/features/authentication/components/protected-layout";

export const dynamic = "force-dynamic";

// Route layouts expose only Next's route props. ProtectedLayout keeps its defaults.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
