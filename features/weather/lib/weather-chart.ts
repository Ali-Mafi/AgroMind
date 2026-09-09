import type { WeatherChartPoint, WeatherMetric } from "../types/weather-detail";

export function chartDomain(points: WeatherChartPoint[], metric: WeatherMetric) {
  const values = points.flatMap((point) => [point.value, point.secondary])
    .filter((value): value is number => value !== null && Number.isFinite(value));
  if (metric === "humidity" || metric === "cloudCover") return [0, 100];
  if (metric === "precipitation" || metric === "wind") return [0, Math.max(1, ...values) * 1.15];
  if (!values.length) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(2, (max - min) * 0.18);
  return [Math.floor(min - padding), Math.ceil(max + padding)];
}

export function linePath(points: WeatherChartPoint[], field: "value" | "secondary", x: (index: number) => number, y: (value: number) => number) {
  let connected = false;
  return points.map((point, index) => {
    const value = point[field];
    if (value === null || !Number.isFinite(value)) { connected = false; return ""; }
    const command = connected ? "L" : "M";
    connected = true;
    return `${command}${x(index).toFixed(2)},${y(value).toFixed(2)}`;
  }).join(" ");
}
