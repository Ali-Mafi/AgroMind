import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ProtectedLayout from "@/features/authentication/components/protected-layout";
import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";

// Keep the immersive viewport local to Dashboard, without changing other routes.
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
  return <ProtectedLayout requireOnboarding><AppShell>{children}</AppShell></ProtectedLayout>;
}
