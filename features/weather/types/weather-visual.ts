import type {
  WeatherCondition,
  WeatherIntensity,
} from "@/features/weather/types/weather-normalization";

export type WeatherDayPeriod =
  | "day"
  | "night";

export type WeatherVisualCondition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "snow"
  | "heavy-snow"
  | "storm"
  | "hail"
  | "dust"
  | "unknown";

export type WeatherVisualState =
  `${WeatherVisualCondition}-${WeatherDayPeriod}`;

export interface WeatherVisualInput {
  condition: WeatherCondition;

  intensity?: WeatherIntensity;

  isDay: boolean;

  isDusty?: boolean;
}