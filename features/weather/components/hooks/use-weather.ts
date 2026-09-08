"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeToWeather, type WeatherRefreshState } from "@/features/weather/lib/weather-refresh";
import type { WeatherCoordinates } from "@/features/weather/types/weather";

export function useWeather(coordinates?: WeatherCoordinates) {
  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;
  const key = latitude !== undefined && longitude !== undefined
    ? `${latitude},${longitude}` : null;
  const [state, setState] = useState<(WeatherRefreshState & { key: string }) | null>(null);
  const refreshHandler = useRef<(() => void) | null>(null);
  const refresh = useCallback(() => refreshHandler.current?.(), []);

  useEffect(() => {
    if (latitude === undefined || longitude === undefined || !key) return;

    const subscription = subscribeToWeather({ latitude, longitude }, (next) => {
      setState({ ...next, key });
    });
    refreshHandler.current = subscription.refresh;

    return () => {
      refreshHandler.current = null;
      subscription.dispose();
    };
  }, [latitude, longitude, key]);

  // Hide the previous farm's report immediately, even before the effect runs.
  const current = state?.key === key ? state : null;
  return {
    weather: current?.weather ?? null,
    isLoading: Boolean(key) && (current?.isLoading ?? true),
    isRefreshing: current?.isRefreshing ?? false,
    error: current?.error ?? null,
    refreshError: current?.refreshError ?? null,
    checkedAt: current?.checkedAt ?? null,
    refresh,
  };
}
