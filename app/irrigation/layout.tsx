import type { ReactNode } from "react";
import ProtectedLayout from "@/features/authentication/components/protected-layout";
import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: ReactNode }) {
  return <ProtectedLayout requireOnboarding><AppShell>{children}</AppShell></ProtectedLayout>;
}
