"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

  detectedRegion: SupportedRegion | null;
  isRegionDetected: boolean;
  isManualOverride: boolean;

  setRegion: (region: SupportedRegion) => void;
  detectRegionFromLocation: () => Promise<SupportedRegion | null>;
  resetRegionToDetected: () => void;
}

const RegionContext = createContext<
  RegionContextValue | undefined
>(undefined);

const REGION_STORAGE_KEY = "agromind-region";
const REGION_SOURCE_STORAGE_KEY =
  "agromind-region-source";

type RegionSource = "detected" | "manual";

function getStoredRegion(): SupportedRegion {
  if (typeof window === "undefined") {
    return DEFAULT_REGION;
  }

  try {
    const savedRegion =
      localStorage.getItem(REGION_STORAGE_KEY);

    if (
      savedRegion &&
      savedRegion in REGIONS
    ) {
      return savedRegion as SupportedRegion;
    }
  } catch {
    // Ignore localStorage errors.
  }

  return DEFAULT_REGION;
}

function getStoredRegionSource(): RegionSource {
  if (typeof window === "undefined") {
    return "detected";
  }

  try {
    const savedSource =
      localStorage.getItem(
        REGION_SOURCE_STORAGE_KEY,
      );

    if (
      savedSource === "manual" ||
      savedSource === "detected"
    ) {
      return savedSource;
    }
  } catch {
    // Ignore localStorage errors.
  }

  return "detected";
}

export function RegionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [region, setRegionState] =
    useState<SupportedRegion>(
      getStoredRegion,
    );

  const [detectedRegion, setDetectedRegion] =
    useState<SupportedRegion | null>(null);

  const [regionSource, setRegionSource] =
    useState<RegionSource>(
      getStoredRegionSource,
    );

  const isDetectingLocationRef = useRef(false);

  /**
   * Persist the current region selection.
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        REGION_STORAGE_KEY,
        region,
      );

      localStorage.setItem(
        REGION_SOURCE_STORAGE_KEY,
        regionSource,
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [region, regionSource]);

  /**
   * Detect region from the user's location.
   *
   * Automatic detection never overrides a manual
   * region selection.
   */
  const detectRegionFromLocation =
    useCallback(async () => {
      console.log(
      "[AgroMind][Location] detectRegionFromLocation CALLED",
      {
        time: new Date().toISOString(),
        provider: Math.random(),
      },
    );

    if (isDetectingLocationRef.current) {
      console.log(
        "[AgroMind][Location] Detection already running — skipped",
      );

      return null;
    }


      isDetectingLocationRef.current = true;

      try {
        const coordinates =
          await requestCurrentLocation();

        console.log(
          "[AgroMind][Location] Coordinates:",
          coordinates,
        );

        const location =
          await reverseGeocode(coordinates);

        console.log(
          "[AgroMind][Location] Reverse geocoding:",
          location,
        );

        const detected =
          getRegionFromCountry(
            location.countryCode,
          );

        if (!detected) {
          console.warn(
            "[AgroMind][Location] No supported region found for country:",
            location.countryCode,
          );

          return null;
        }

        setDetectedRegion(detected);

        console.log(
          "[AgroMind][Location] Detected region:",
          detected,
        );

        if (regionSource !== "manual") {
          setRegionState(detected);
          setRegionSource("detected");

          console.log(
            "[AgroMind][Region] Region updated to:",
            detected,
          );
        } else {
          console.log(
            "[AgroMind][Region] Manual region preserved:",
            region,
          );
        }

        return detected;
      } catch (error) {
        console.error(
          "[AgroMind][Location] Detection failed:",
          error,
        );

        return null;
      } finally {
        isDetectingLocationRef.current = false;
      }
    }, [region, regionSource]);

  /**
   * Manually select a region.
   *
   * Manual selection takes priority over automatic
   * location detection.
   */
  const setRegion = useCallback(
    (nextRegion: SupportedRegion) => {
      setRegionState(nextRegion);
      setRegionSource("manual");

      console.log(
        "[AgroMind][Region] Manual region selected:",
        nextRegion,
      );
    },
    [],
  );

  /**
   * Return to automatic location-based detection.
   */
  const resetRegionToDetected =
    useCallback(() => {
      if (detectedRegion) {
        setRegionState(detectedRegion);
        setRegionSource("detected");

        console.log(
          "[AgroMind][Region] Reset to detected region:",
          detectedRegion,
        );

        return;
      }

      setRegionSource("detected");

      console.log(
        "[AgroMind][Region] Automatic detection enabled.",
      );
    }, [detectedRegion]);

  const regionConfig = useMemo(
    () => REGIONS[region],
    [region],
  );

  const isRegionDetected =
    detectedRegion !== null;

  const isManualOverride =
    regionSource === "manual";

  const value = useMemo(
    () => ({
      region,
      regionConfig,

      detectedRegion,
      isRegionDetected,
      isManualOverride,

      setRegion,
      detectRegionFromLocation,
      resetRegionToDetected,
    }),
    [
      region,
      regionConfig,
      detectedRegion,
      isRegionDetected,
      isManualOverride,
      setRegion,
      detectRegionFromLocation,
      resetRegionToDetected,
    ],
  );

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context =
    useContext(RegionContext);

  if (!context) {
    throw new Error(
      "useRegion must be used inside RegionProvider",
    );
  }

  return context;
}