import { fromCanonical, SYMBOLS } from "@/features/settings/lib/units";
import { chartDomain } from "./weather-chart";
import type { Units } from "@/features/settings/types/preferences";
import type { WeatherChartPoint, WeatherMetric } from "../types/weather-detail";

export function metricKind(metric: WeatherMetric): keyof Units | null {
  if (metric === "temperature" || metric === "overnight" || metric === "dewPoint") return "temperature";
  if (metric === "wind" || metric === "precipitation" || metric === "pressure") return metric;
  return null;
}
export function displayMetric(value: number, metric: WeatherMetric, units: Units) {
  const kind = metricKind(metric);
  return kind ? fromCanonical(value, kind, units) : value;
}
export function metricUnit(metric: WeatherMetric, units: Units) {
  const kind = metricKind(metric);
  return kind ? SYMBOLS[units[kind]] : metric === "daylight" ? "" : "%";
}
export function displayChart(points: WeatherChartPoint[], metric: WeatherMetric, units: Units) {
  return {
    points: points.map((point) => ({ ...point,
      value: point.value === null ? null : displayMetric(point.value, metric, units),
      secondary: point.secondary === null ? null : displayMetric(point.secondary, metric, units),
    })),
    // Convert the canonical domain too: a 1 mm minimum must not become a 1 inch minimum.
    domain: chartDomain(points, metric).map((value) => displayMetric(value, metric, units)),
    freezing: fromCanonical(0, "temperature", units),
  };
}
