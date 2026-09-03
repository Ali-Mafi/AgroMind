import type {
  WeatherVisualCondition,
  WeatherVisualInput,
  WeatherVisualState,
} from "@/features/weather/types/weather-visual";

export function resolveWeatherVisualState({
  condition,
  intensity,
  isDay,
  isDusty = false,
}: WeatherVisualInput): WeatherVisualState {
  const period =
    isDay ? "day" : "night";

  if (isDusty) {
    return `dust-${period}`;
  }

  let visualCondition:
    WeatherVisualCondition;

  switch (condition) {
    case "clear":
    case "mainly-clear":
      visualCondition = "clear";
      break;

    case "partly-cloudy":
      visualCondition = "partly-cloudy";
      break;

    case "overcast":
      visualCondition = "cloudy";
      break;

    case "fog":
    case "rime-fog":
      visualCondition = "fog";
      break;

    case "drizzle":
    case "freezing-drizzle":
      visualCondition = "drizzle";
      break;

    case "rain":
    case "freezing-rain":
    case "rain-showers":
      visualCondition =
        intensity === "heavy"
          ? "heavy-rain"
          : "rain";
      break;

    case "snow":
    case "snow-grains":
    case "snow-showers":
      visualCondition =
        intensity === "heavy"
          ? "heavy-snow"
          : "snow";
      break;

    case "thunderstorm":
      visualCondition = "storm";
      break;

    case "thunderstorm-hail":
      visualCondition = "hail";
      break;

    case "unknown":
    default:
      visualCondition = "unknown";
      break;
  }

  return `${visualCondition}-${period}`;
}