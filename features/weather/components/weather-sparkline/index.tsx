import { T } from "@/features/settings/components/translated-text";
import type { WeatherChartPoint, WeatherMetric } from "@/features/weather/types/weather-detail";
import { useMemo } from "react";
import { linePath } from "@/features/weather/lib/weather-chart";
import { displayChart } from "@/features/weather/lib/weather-display-units";
import { useWeatherFormat } from "../hooks/use-weather-format";
import styles from "../weather-experience/weather-experience.module.css";

export function WeatherSparkline({ points: canonicalPoints, metric }: { points: WeatherChartPoint[]; metric: WeatherMetric }) {
  const { units } = useWeatherFormat();
  const { points, domain: [min, max] } = useMemo(() => displayChart(canonicalPoints, metric, units), [canonicalPoints, metric, units]);
  if (!points.some((point) => point.value !== null)) return <span className={styles.sparklineEmpty}><T text="Forecast unavailable" /></span>;
  const x = (index: number) => 3 + index / Math.max(1, points.length - 1) * 194;
  const y = (value: number) => 45 - (value - min) / (max - min) * 40;
  return (
    <svg viewBox="0 0 200 50" className={styles.sparkline} preserveAspectRatio="none" aria-hidden="true">
      {metric === "precipitation" ? points.map((point, index) => point.value === null ? null :
        <rect key={point.key} x={index * 200 / points.length + 1} y={y(point.value)}
          width={Math.max(1, 200 / points.length - 3)} height={Math.max(1, 46 - y(point.value))} rx="2" fill="currentColor" />)
        : <path d={linePath(points, "value", x, y)} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
      {points.some((point) => point.secondary !== null) && metric === "wind" &&
        <path d={linePath(points, "secondary", x, y)} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.55" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}
