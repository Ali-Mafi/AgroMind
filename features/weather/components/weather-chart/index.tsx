"use client";

import { useId, type PointerEvent } from "react";
import { chartDomain, linePath } from "@/features/weather/lib/weather-chart";
import type { WeatherChartPoint, WeatherMetric } from "@/features/weather/types/weather-detail";
import { WEATHER_METRICS, weatherClock } from "@/features/weather/lib/weather-presentation";
import styles from "../weather-experience/weather-experience.module.css";

const WIDTH = 640;
const HEIGHT = 240;
const LEFT = 48;
const RIGHT = 18;
const TOP = 20;
const BOTTOM = 32;

export function WeatherChart({ points, metric, selectedIndex, onSelect }: {
  points: WeatherChartPoint[]; metric: WeatherMetric; selectedIndex: number; onSelect: (index: number) => void;
}) {
  const id = useId();
  const [min, max] = chartDomain(points, metric);
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const first = points[0]?.position ?? 0;
  const last = points.at(-1)?.position ?? 1;
  const x = (index: number) => LEFT + (points.length === 1 ? 0.5 : (points[index].position - first) / Math.max(1, last - first)) * plotWidth;
  const y = (value: number) => TOP + (max - value) / (max - min) * plotHeight;
  const selected = points[selectedIndex];
  const hasData = points.some((point) => point.value !== null);
  const ticks = Array.from({ length: 5 }, (_, index) => min + (max - min) * index / 4);
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 3), Math.floor((points.length - 1) * 2 / 3), points.length - 1])].filter((index) => index >= 0);

  const selectAtPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (event.type === "pointermove" && event.pointerType !== "mouse" && event.buttons !== 1) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = (event.clientX - bounds.left) / bounds.width * WIDTH;
    let closest = 0;
    points.forEach((_, index) => { if (Math.abs(x(index) - pointerX) < Math.abs(x(closest) - pointerX)) closest = index; });
    onSelect(closest);
  };

  if (!points.length || !hasData) return <p className={styles.chartEmpty}>No {WEATHER_METRICS[metric].title.toLowerCase()} forecast is available for this day.</p>;

  return (
    <div className={styles.chart} data-metric={metric}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={`${id}-title ${id}-description`}
        onPointerDown={selectAtPointer} onPointerMove={selectAtPointer}>
        <title id={`${id}-title`}>{`${WEATHER_METRICS[metric].title} hourly forecast`}</title>
        <desc id={`${id}-description`}>Use the forecast hour slider or the data table below for exact values. Gaps mean unavailable data.</desc>
        {ticks.map((tick, index) => <g key={index}>
          <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(tick)} y2={y(tick)} className={styles.chartGrid} />
          <text x={LEFT - 10} y={y(tick) + 4} textAnchor="end" className={styles.chartLabel}>
            {metric === "precipitation" ? tick.toFixed(1) : Math.round(tick)}
          </text>
        </g>)}
        {(metric === "overnight" || metric === "temperature") && min < 0 && max > 0 &&
          <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(0)} y2={y(0)} stroke="var(--weather-cold)" strokeDasharray="5 5" />}
        {metric === "precipitation" ? points.map((point, index) => point.value === null ? null :
          <rect key={point.key} x={x(index) - Math.min(12, plotWidth / points.length * 0.3)} y={y(point.value)}
            width={Math.min(24, plotWidth / points.length * 0.6)} height={Math.max(0, y(0) - y(point.value))}
            rx="3" fill="var(--metric-color)" opacity={index === selectedIndex ? 1 : 0.65} />)
          : <path d={linePath(points, "value", x, y)} fill="none" stroke="var(--metric-color)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
        <path d={linePath(points, "secondary", x, y)} fill="none" stroke="var(--weather-secondary-line)" strokeWidth="2" strokeDasharray="6 5" />
        {selected && <g>
          <line x1={x(selectedIndex)} x2={x(selectedIndex)} y1={TOP} y2={HEIGHT - BOTTOM} stroke="white" opacity="0.4" />
          {selected.value !== null && <circle cx={x(selectedIndex)} cy={y(selected.value)} r="5" fill="var(--metric-color)" stroke="white" strokeWidth="2" />}
        </g>}
        {labelIndexes.map((index) => <text key={index} x={x(index)} y={HEIGHT - 8} textAnchor="middle" className={styles.chartLabel}>{weatherClock(points[index].time)}</text>)}
      </svg>
      <label className={styles.scrubber} htmlFor={id}>
        <span>Forecast hour</span>
        <input id={id} type="range" min="0" max={points.length - 1} step="1" value={selectedIndex}
          onChange={(event) => onSelect(Number(event.target.value))}
          aria-valuetext={selected ? `${weatherClock(selected.time)}, ${selected.value ?? "unavailable"} ${WEATHER_METRICS[metric].unit}` : "No data"} />
      </label>
    </div>
  );
}
