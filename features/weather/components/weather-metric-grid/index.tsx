import { T } from "@/features/settings/components/translated-text";
import { useWeatherFormat } from "../hooks/use-weather-format";
import { memo } from "react";
import { ChevronRight, Droplets, Gauge, Moon, Sunrise, Thermometer, Umbrella, Waves, Wind, type LucideIcon } from "lucide-react";
import { WeatherSparkline } from "../weather-sparkline";
import { normalizeWindDirection } from "@/features/weather/lib/normalize-weather";
import {
  daylightMinutes, localWeatherTime, nextNight,
  upcomingHours, weatherChartPoints,
} from "@/features/weather/lib/weather-presentation";
import type { WeatherData } from "@/features/weather/types/weather";
import type { WeatherDetailSelection, WeatherMetric } from "@/features/weather/types/weather-detail";
import styles from "../weather-experience/weather-experience.module.css";

interface MetricCardData {
  metric: WeatherMetric; title: string; Icon: LucideIcon; value: string;
  unit?: string; subtitle: string; footnote: string;
}

export function DaylightGraphic({ sunrise, sunset }: { sunrise: string | null; sunset: string | null }) {
  if (!sunrise || !sunset) return <span className={styles.sparklineEmpty}><T text="Sunrise / sunset unavailable" /></span>;
  const position = (time: string) => (Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16))) / 1440 * 200;
  // This is a 24-hour timeline of astronomical times, not a sunshine forecast.
  return <svg viewBox="0 0 200 55" className={styles.daylightGraphic} aria-hidden="true">
    <line x1="1" x2="199" y1="28" y2="28" stroke="var(--weather-border)" strokeWidth="8" strokeLinecap="round" />
    <line x1={position(sunrise)} x2={position(sunset)} y1="28" y2="28" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    <circle cx={position(sunrise)} cy="28" r="6" fill="var(--weather-gold)" stroke="var(--weather-surface)" strokeWidth="2" />
    <circle cx={position(sunset)} cy="28" r="6" fill="var(--weather-gold)" stroke="var(--weather-surface)" strokeWidth="2" />
  </svg>;
}

export const WeatherMetricGrid = memo(function WeatherMetricGrid({ weather, asOf, onOpen }: {
  weather: WeatherData; asOf: number; onOpen: (selection: WeatherDetailSelection) => void;
}) {
  const { chanceLabel, durationLabel, temperature, rainAmount, weatherClock, reading, symbol, measure, t, number } = useWeatherFormat();
  const todayKey = localWeatherTime(weather.timezone, asOf).slice(0, 10);
  const today = weather.daily.find((day) => day.date === todayKey);
  const hours = upcomingHours(weather, asOf);
  const night = nextNight(hours);
  const current = weather.current;
  const currentLabel = current.source === "open-meteo" ? "Model estimate" : "Current report";
  const low = night.length ? Math.min(...night.map((hour) => hour.temperature)) : null;
  const wind = normalizeWindDirection(current.windDirection);
  const cards: MetricCardData[] = [
    { metric: "precipitation", title: "Precipitation", Icon: Umbrella,
      value: rainAmount(today?.precipitationSum), unit: symbol("precipitation"), subtitle: "Today's total forecast",
      footnote: today?.precipitationProbability != null ? `${number(today.precipitationProbability, 0)}% ${chanceLabel(today.precipitationProbabilityKind).toLowerCase()}` : "Chance unavailable" },
    { metric: "wind", title: "Wind & gusts", Icon: Wind,
      value: reading(current.windSpeed, "wind"), unit: symbol("wind"), subtitle: t("From {direction} · {report}", { direction: wind.cardinal, report: t(currentLabel) }),
      footnote: t("Gusts {value} now", { value: measure(current.windGusts, "wind", 0) }) },
    { metric: "temperature", title: "Temperature", Icon: Thermometer,
      value: temperature(current.temperature), subtitle: t("Feels like {value}", { value: temperature(current.feelsLike) }),
      footnote: today ? t("Today's forecast {low} to {high}", { low: temperature(today.temperatureMin), high: temperature(today.temperatureMax) }) : "Daily range unavailable" },
    { metric: "humidity", title: "Humidity", Icon: Droplets,
      value: `${number(current.humidity, 0)}%`, subtitle: t("Relative humidity · {report}", { report: t(currentLabel) }),
      footnote: "Air humidity, not soil moisture" },
    { metric: "overnight", title: "Night low", Icon: Moon,
      value: temperature(low), subtitle: current.isDay ? "Next night · Forecast" : "Rest of night · Forecast",
      footnote: low === null ? "Night forecast unavailable" : low <= 0 ? t("Air temperature forecast at or below {value}", { value: measure(0, "temperature", 0) }) : "Open the night temperature chart" },
    { metric: "dewPoint", title: "Dew point", Icon: Waves,
      value: temperature(current.dewPoint), subtitle: current.dewPoint === null ? "Current reading unavailable" : currentLabel,
      footnote: "Compare dew point with air temperature" },
    { metric: "daylight", title: "Daylight", Icon: Sunrise,
      value: durationLabel(daylightMinutes(today)), subtitle: t("Sunrise {time}", { time: weatherClock(today?.sunrise ?? null) }),
      footnote: t("Sunset {time} · Local time", { time: weatherClock(today?.sunset ?? null) }) },
    { metric: "pressure", title: "Pressure", Icon: Gauge,
      value: reading(current.pressure, "pressure"), unit: symbol("pressure"), subtitle: currentLabel,
      footnote: "Open the hourly pressure trend" },
  ];

  return <>
    <div className={styles.metricHeading}><h2><T text="Conditions for your field" /></h2><p><T text="Tap a card for hourly details" /></p></div>
    <div className={styles.metricGrid}>
      {cards.map(({ metric, title, Icon, value, unit, subtitle, footnote }) => (
        <button type="button" key={metric} className={`${styles.glass} ${styles.metricCard}`} data-metric={metric}
          onClick={() => onOpen({ metric, date: metric === "overnight" ? night[0]?.time.slice(0, 10) ?? todayKey : todayKey })}
          aria-label={`${t(title)}: ${value}${unit ? ` ${unit}` : ""}. ${t(subtitle)}. ${t("Open chart and details")}`}>
          <span className={styles.sectionTitle}><span><Icon />{t(title)}</span><ChevronRight size={14} /></span>
          <span className={styles.metricValue}>{value}{unit && <> <small>{unit}</small></>}</span>
          <span className={styles.metricSubtitle}>{t(subtitle)}</span>
          {metric === "daylight" ? <DaylightGraphic sunrise={today?.sunrise ?? null} sunset={today?.sunset ?? null} />
            : <WeatherSparkline points={weatherChartPoints(metric === "overnight" ? night : hours, metric)} metric={metric} />}
          <span className={styles.metricFootnote}>{t(footnote)}</span>
        </button>
      ))}
    </div>
  </>;
});
