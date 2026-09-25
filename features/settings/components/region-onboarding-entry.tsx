"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useSettings } from "../context/settings-context";

// The dialog and its country selects are not required for SSR or app routes.
// Keep this boundary mounted alongside, never around, the page content.
const RegionOnboarding = dynamic(
  () => import("./region-onboarding").then(module => module.RegionOnboarding),
  { ssr: false },
);

export function RegionOnboardingEntry() {
  const pathname = usePathname();
  const { isHydrated, preferences } = useSettings();
  return pathname === "/" && isHydrated && !preferences.regionConfirmed
    ? <RegionOnboarding />
    : null;
}
