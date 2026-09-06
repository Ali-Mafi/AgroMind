import type {
  WeatherVisualState,
} from "@/features/weather/types/weather-visual";

const WEATHER_BACKGROUND_ASSETS: Partial<
  Record<WeatherVisualState, string>
> = {
  "clear-day":
    "/weather/backgrounds/clear-day.webp",

  "clear-night":
    "/weather/backgrounds/clear-night.webp",

  "partly-cloudy-day":
    "/weather/backgrounds/partly-cloudy-day.webp",

  "partly-cloudy-night":
    "/weather/backgrounds/partly-cloudy-night.webp",

  "cloudy-day":
    "/weather/backgrounds/cloudy-day.webp",

  "cloudy-night":
    "/weather/backgrounds/cloudy-night.webp",

  // Drizzle
  "drizzle-day":
    "/weather/backgrounds/rainy-day.webp",

  "drizzle-night":
    "/weather/backgrounds/rainy-night.webp",

  // Rain
  "rain-day":
    "/weather/backgrounds/rainy-day.webp",

  "rain-night":
    "/weather/backgrounds/rainy-night.webp",

  // Heavy rain
  "heavy-rain-day":
    "/weather/backgrounds/rainy-day.webp",

  "heavy-rain-night":
    "/weather/backgrounds/rainy-night.webp",

  // Temporary fallback until dedicated assets exist
  "storm-day":
    "/weather/backgrounds/rainy-day.webp",

  "storm-night":
    "/weather/backgrounds/rainy-night.webp",

  "hail-day":
    "/weather/backgrounds/rainy-day.webp",

  "hail-night":
    "/weather/backgrounds/rainy-night.webp",
};

const DAY_FALLBACK =
  "/weather/backgrounds/clear-day.webp";

const NIGHT_FALLBACK =
  "/weather/backgrounds/clear-night.webp";

export function resolveWeatherBackground(
  visualState: WeatherVisualState,
) {
  return (
    WEATHER_BACKGROUND_ASSETS[visualState] ??
    (visualState.endsWith("-night")
      ? NIGHT_FALLBACK
      : DAY_FALLBACK)
  );
}