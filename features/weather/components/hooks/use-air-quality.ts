"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getAirQuality,
} from "@/features/weather/services/air-quality-service";

import type {
  AirQualityData,
} from "@/features/weather/types/air-quality";

import type {
  WeatherCoordinates,
} from "@/features/weather/types/weather";

export function useAirQuality(
  coordinates?: WeatherCoordinates,
) {
  const [airQuality, setAirQuality] =
    useState<AirQualityData | null>(null);

  const [isLoading, setIsLoading] =
    useState(Boolean(coordinates));

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (
      coordinates?.latitude === undefined ||
      coordinates?.longitude === undefined
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAirQuality(null);
      setIsLoading(false);
      setError(null);

      return;
    }

    const currentCoordinates: WeatherCoordinates = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };

    let cancelled = false;

    async function loadAirQuality() {
      try {
        setIsLoading(true);
        setError(null);

        const data =
          await getAirQuality(
            currentCoordinates,
          );

        if (cancelled) {
          return;
        }

        setAirQuality(data);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load air quality:",
          error,
        );

        setAirQuality(null);

        setError(
          "Unable to load air quality data.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAirQuality();

    return () => {
      cancelled = true;
    };
  }, [
    coordinates?.latitude,
    coordinates?.longitude,
  ]);

  return {
    airQuality,
    isLoading,
    error,
  };
}