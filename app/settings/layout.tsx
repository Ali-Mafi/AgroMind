import type { ReactNode } from "react";
import ProtectedLayout from "@/features/authentication/components/protected-layout";
export default function Layout({ children }: { children: ReactNode }) {
  return <ProtectedLayout requireOnboarding>{children}</ProtectedLayout>;
}

export const dynamic = "force-dynamic";
