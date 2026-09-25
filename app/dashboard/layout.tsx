import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ProtectedLayout from "@/features/authentication/components/protected-layout";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceLoadingBoundary } from "@/components/layout/workspace-loading-boundary";
export const dynamic = "force-dynamic";

// Match the root install/launch viewport; never switch viewport-fit after launch.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#183c2b",
};

export const metadata: Metadata = {
  appleWebApp: { capable: true, title: "AgroMind", statusBarStyle: "black-translucent" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <WorkspaceLoadingBoundary><ProtectedLayout requireOnboarding><AppShell>{children}</AppShell></ProtectedLayout></WorkspaceLoadingBoundary>;
}
