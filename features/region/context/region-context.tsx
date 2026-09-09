"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useSettings } from "@/features/settings/context/settings-context";
import { countryFromLocale } from "@/features/settings/lib/preferences";
import { REGION_PROFILES } from "@/features/settings/constants/region-profiles";
import { requestCurrentLocation, reverseGeocode } from "../services/location-service";
import { getRegionFromCountry } from "../utils/country-to-region";
import type { RegionConfig, SupportedRegion } from "../types/region";

interface RegionContextValue {
  region: SupportedRegion; regionConfig: RegionConfig; detectedRegion: SupportedRegion | null;
  isRegionDetected: boolean; isManualOverride: boolean;
  setRegion: (region: SupportedRegion) => void;
  detectRegionFromLocation: () => Promise<SupportedRegion | null>;
  resetRegionToDetected: () => void;
}
const RegionContext = createContext<RegionContextValue | undefined>(undefined);

// Compatibility for region consumers. Language/direction are resolved independently.
export function RegionProvider({ children }: { children: ReactNode }) {
  const { country, preferences, calendar, direction, update } = useSettings();
  const [detectedRegion, setDetectedRegion] = useState<SupportedRegion | null>(null);
  const region = REGION_PROFILES[country].locale as SupportedRegion;
  const setRegion = useCallback((next: SupportedRegion) => {
    const nextCountry = countryFromLocale(next);
    if (nextCountry) update({ country: nextCountry, regionSource: "manual", regionConfirmed: true });
  }, [update]);
  const detectRegionFromLocation = useCallback(async () => {
    const location = await reverseGeocode(await requestCurrentLocation());
    const detected = getRegionFromCountry(location.countryCode);
    setDetectedRegion(detected);
    // Detection proposes a region; only an explicit choice applies it.
    return detected;
  }, []);
  return <RegionContext.Provider value={{
    region, regionConfig: { locale: region, name: REGION_PROFILES[country].name, calendar, direction },
    detectedRegion, isRegionDetected: detectedRegion !== null, isManualOverride: preferences.regionSource === "manual",
    setRegion, detectRegionFromLocation,
    resetRegionToDetected: () => {
      const detected = detectedRegion && countryFromLocale(detectedRegion);
      if (detected) update({ country: detected, regionSource: "detected", regionConfirmed: true });
    },
  }}>{children}</RegionContext.Provider>;
}
export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) throw new Error("useRegion must be used inside RegionProvider");
  return context;
}
