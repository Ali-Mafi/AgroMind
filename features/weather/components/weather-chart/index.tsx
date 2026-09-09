"use client";

import { T } from "@/features/settings/components/translated-text";
import { useId, useMemo, type PointerEvent } from "react";
import { linePath } from "@/features/weather/lib/weather-chart";
import { displayChart } from "@/features/weather/lib/weather-display-units";
import { useWeatherFormat } from "../hooks/use-weather-format";
import type { WeatherChartPoint, WeatherMetric } from "@/features/weather/types/weather-detail";
import { WEATHER_METRICS } from "@/features/weather/lib/weather-presentation";
import styles from "../weather-experience/weather-experience.module.css";

const WIDTH = 640;
const HEIGHT = 240;
const LEFT = 48;
const RIGHT = 18;
const TOP = 20;
const BOTTOM = 32;

export function WeatherChart({ points: canonicalPoints, metric, selectedIndex, onSelect }: {
  points: WeatherChartPoint[]; metric: WeatherMetric; selectedIndex: number; onSelect: (index: number) => void;
}) {
  const id = useId();
  const { units, unit, number, weatherClock, t } = useWeatherFormat();
  const { points, domain: [min, max], freezing } = useMemo(() => displayChart(canonicalPoints, metric, units), [canonicalPoints, metric, units]);
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
    if (closest !== selectedIndex) onSelect(closest);
  };

  if (!points.length || !hasData) return <p className={styles.chartEmpty}>{t("No {metric} forecast is available for this day.", { metric: t(WEATHER_METRICS[metric].title).toLowerCase() })}</p>;

  return (
    <div className={styles.chart} data-metric={metric} data-unit={unit(metric)} dir="ltr">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={`${id}-title ${id}-description`}
        onPointerDown={selectAtPointer} onPointerMove={selectAtPointer}>
        <title id={`${id}-title`}>{`${t(WEATHER_METRICS[metric].title)} · ${t("Hourly forecast")}`}</title>
        <desc id={`${id}-description`}><T text="Use the forecast hour slider or the data table below for exact values. Gaps mean unavailable data or a change of forecast provider." /></desc>
        {ticks.map((tick, index) => <g key={index}>
          <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(tick)} y2={y(tick)} className={styles.chartGrid} />
          <text x={LEFT - 10} y={y(tick) + 4} textAnchor="end" className={styles.chartLabel}>
            {number(tick, metric === "precipitation" || metric === "pressure" ? 2 : 0)}
          </text>
        </g>)}
        {(metric === "overnight" || metric === "temperature") && min < freezing && max > freezing &&
          <line data-freezing-reference={freezing} x1={LEFT} x2={WIDTH - RIGHT} y1={y(freezing)} y2={y(freezing)} stroke="var(--weather-cold)" strokeDasharray="5 5" />}
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
        <span><T text="Forecast hour" /></span>
        <input id={id} type="range" min="0" max={points.length - 1} step="1" value={selectedIndex}
          onChange={(event) => onSelect(Number(event.target.value))}
          aria-valuetext={selected ? `${weatherClock(selected.time)}, ${selected.value === null ? t("Unavailable") : number(selected.value, 2)} ${unit(metric)}` : t("No data")} />
      </label>
    </div>
  );
}
