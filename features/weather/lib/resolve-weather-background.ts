import type {
  WeatherVisualState,
} from "@/features/weather/types/weather-visual";

const WEATHER_BACKGROUND_ASSETS = {
  "clear-day":
    "/weather/backgrounds/clear-day.png",

  "clear-night":
    "/weather/backgrounds/clear-night.png",
} as const;

const DAY_FALLBACK =
  "/weather/backgrounds/clear-day.png";

const NIGHT_FALLBACK =
  "/weather/backgrounds/clear-night.png";

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