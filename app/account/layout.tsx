import type { ReactNode } from "react";
import ProtectedLayout from "@/features/authentication/components/protected-layout";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceLoadingBoundary } from "@/components/layout/workspace-loading-boundary";
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: ReactNode }) {
  return <WorkspaceLoadingBoundary><ProtectedLayout><AppShell>{children}</AppShell></ProtectedLayout></WorkspaceLoadingBoundary>;
}
