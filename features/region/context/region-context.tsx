"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_REGION,
  REGIONS,
} from "@/features/region/constants/regions";

import type {
  RegionConfig,
  SupportedRegion,
} from "@/features/region/types/region";

import { getRegionFromCountry } from "@/features/region/utils/country-to-region";

import {
  requestCurrentLocation,
  reverseGeocode,
} from "@/features/region/services/location-service";

interface RegionContextValue {
  region: SupportedRegion;
  regionConfig: RegionConfig;
  setRegion: (region: SupportedRegion) => void;
  detectRegionFromLocation: () => Promise<void>;
}

const RegionContext = createContext<RegionContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "agromind-region";

export function RegionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [region, setRegionState] =
    useState<SupportedRegion>(DEFAULT_REGION);

  useEffect(() => {
    const savedRegion = localStorage.getItem(STORAGE_KEY);

    if (savedRegion && savedRegion in REGIONS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegionState(savedRegion as SupportedRegion);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, region);
  }, [region]);

  const setRegion = (nextRegion: SupportedRegion) => {
    setRegionState(nextRegion);
  };

  async function detectRegionFromLocation() {
    const coordinates = await requestCurrentLocation();

    const location = await reverseGeocode(coordinates);

    const detectedRegion = getRegionFromCountry(
      location.countryCode,
    );

    if (!detectedRegion) {
      return;
    }

    setRegionState(detectedRegion);
  }

  const regionConfig = useMemo(
    () => REGIONS[region],
    [region],
  );

  const value = useMemo(
    () => ({
      region,
      regionConfig,
      setRegion,
      detectRegionFromLocation,
    }),
    [region, regionConfig],
  );

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);

  if (!context) {
    throw new Error(
      "useRegion must be used inside RegionProvider",
    );
  }

  return context;
}