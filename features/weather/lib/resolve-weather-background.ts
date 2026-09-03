import type {
  WeatherVisualState,
} from "@/features/weather/types/weather-visual";

const WEATHER_BACKGROUND_ASSETS = {
  "clear-day":
    "/weather/backgrounds/clear-day.webp",

  "clear-night":
    "/weather/backgrounds/clear-night.webp",
} as const;

const DAY_FALLBACK =
  "/weather/backgrounds/clear-day.webp";

const NIGHT_FALLBACK =
  "/weather/backgrounds/clear-night.webp";

export function resolveWeatherBackground(
  visualState: WeatherVisualState,
) {
  if (
    visualState in
    WEATHER_BACKGROUND_ASSETS
  ) {
    return WEATHER_BACKGROUND_ASSETS[
      visualState as keyof typeof WEATHER_BACKGROUND_ASSETS
    ];
  }

  return visualState.endsWith("-night")
    ? NIGHT_FALLBACK
    : DAY_FALLBACK;
}