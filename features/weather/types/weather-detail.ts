import type { WeatherSource } from "./weather";

export type WeatherMetric =
  | "precipitation"
  | "wind"
  | "temperature"
  | "humidity"
  | "dewPoint"
  | "overnight"
  | "daylight"
  | "pressure"
  | "cloudCover";

export interface WeatherDetailSelection {
  metric: WeatherMetric;
  date: string;
  hour?: string;
}

export interface WeatherChartPoint {
  source?: WeatherSource;
  key: string;
  time: string;
  /** A sortable timestamp; local wall-clock time is used only if no epoch exists. */
  position: number;
  value: number | null;
  secondary: number | null;
}
