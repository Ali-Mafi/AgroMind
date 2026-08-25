"use client";

import { useEffect, useState } from "react";

import { getWeather } from "@/features/weather/services/weather-service";
import type {
  WeatherCoordinates,
  WeatherData,
} from "@/features/weather/types/weather";

export function useWeather(
  coordinates?: WeatherCoordinates,
) {
  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [isLoading, setIsLoading] = useState(
    Boolean(coordinates),
  );

  const [error, setError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (
      coordinates?.latitude === undefined ||
      coordinates?.longitude === undefined
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWeather(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentCoordinates: WeatherCoordinates = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };

    let cancelled = false;

    async function loadWeather() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getWeather(
          currentCoordinates,
        );

        if (cancelled) return;

        setWeather(data);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load weather:",
          error,
        );

        setWeather(null);
        setError(
          "Unable to load weather data.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [
    coordinates?.latitude,
    coordinates?.longitude,
  ]);

  return {
    weather,
    isLoading,
    error,
  };
}