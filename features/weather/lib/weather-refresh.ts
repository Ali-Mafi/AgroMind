import { getWeather } from "@/features/weather/services/weather-service";
import type { WeatherCoordinates, WeatherData } from "../types/weather";

export const WEATHER_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export interface WeatherRefreshState {
  weather: WeatherData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refreshError: string | null;
  checkedAt: number | null;
}

/** One subscription per location; requests never overlap or run in hidden tabs. */
export function subscribeToWeather(
  coordinates: WeatherCoordinates,
  onChange: (state: WeatherRefreshState) => void,
) {
  let disposed = false;
  let request: AbortController | null = null;
  let lastAttempt: number | null = null;
  let state: WeatherRefreshState = {
    weather: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
    refreshError: null,
    checkedAt: null,
  };

  function update(patch: Partial<WeatherRefreshState>) {
    state = { ...state, ...patch };
    if (!disposed) onChange(state);
  }

  async function load(force = false) {
    if (disposed || request || document.visibilityState === "hidden") return;
    if (navigator.onLine === false) {
      update(state.weather
        ? { refreshError: "Offline. Showing the last received report." }
        : { isLoading: false, error: "You are offline. Reconnect to load weather." });
      return;
    }
    if (!force && lastAttempt !== null && Date.now() - lastAttempt < WEATHER_REFRESH_INTERVAL_MS) return;

    lastAttempt = Date.now();
    const controller = new AbortController();
    request = controller;
    const timeout = setTimeout(() => controller.abort(), 25000);
    update({
      isLoading: !state.weather,
      isRefreshing: Boolean(state.weather),
      error: null,
      refreshError: null,
    });

    try {
      const weather = await getWeather(coordinates, controller.signal);
      if (!disposed) update({ weather, error: null, refreshError: null });
    } catch {
      if (!disposed) update(state.weather
        ? { refreshError: "Could not refresh. Showing the last received report." }
        : { error: "Unable to load weather data. Please try again." });
    } finally {
      clearTimeout(timeout);
      request = null;
      if (!disposed) update({ isLoading: false, isRefreshing: false, checkedAt: Date.now() });
    }
  }

  const refresh = () => { void load(true); };
  const refreshIfDue = () => { void load(); };
  const onOffline = () => {
    update(state.weather
      ? { refreshError: "Offline. Showing the last received report." }
      : { isLoading: false, error: "You are offline. Reconnect to load weather." });
  };

  const timer = setInterval(refreshIfDue, WEATHER_REFRESH_INTERVAL_MS);
  document.addEventListener("visibilitychange", refreshIfDue);
  window.addEventListener("focus", refreshIfDue);
  window.addEventListener("online", refresh);
  window.addEventListener("offline", onOffline);
  refresh();

  return {
    refresh,
    dispose() {
      disposed = true;
      clearInterval(timer);
      request?.abort();
      document.removeEventListener("visibilitychange", refreshIfDue);
      window.removeEventListener("focus", refreshIfDue);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", onOffline);
    },
  };
}
