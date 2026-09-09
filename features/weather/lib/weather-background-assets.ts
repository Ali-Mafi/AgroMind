import { resolveWeatherBackground } from "./resolve-weather-background";
import type { WeatherVisualState } from "../types/weather-visual";

/** Preserve local asset mappings while preferring converted WebP files. */
export function weatherBackgroundCandidates(state: WeatherVisualState) {
  const period = state.endsWith("-night") ? "night" : "day";
  const condition = state.slice(0, -(period.length + 1));
  if (condition === "unknown") return [];
  const mapped = resolveWeatherBackground(state);
  const mappedIsClearFallback = /\/clear-(day|night)\.(webp|png|jpe?g)$/i.test(mapped)
    && condition !== "clear";
  const names = [state];
  if (["heavy-rain", "storm", "hail", "drizzle"].includes(condition)) names.push(`rain-${period}`);
  if (condition === "heavy-snow") names.push(`snow-${period}`);
  if (["rain", "heavy-rain", "storm", "hail", "snow", "heavy-snow", "drizzle", "fog"].includes(condition)) names.push(`cloudy-${period}`);
  if (condition === "partly-cloudy") names.push(`clear-${period}`);
  return [...new Set([
    ...(!mappedIsClearFallback ? [mapped.replace(/\.(png|jpe?g)$/i, ".webp"), mapped] : []),
    ...names.flatMap((name) => [`/weather/backgrounds/${name}.webp`, `/weather/backgrounds/${name}.png`]),
  ])];
}
