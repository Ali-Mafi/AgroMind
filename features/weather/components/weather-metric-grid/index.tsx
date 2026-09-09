import { ChevronRight, Droplets, Gauge, Moon, Sunrise, Thermometer, Umbrella, Waves, Wind, type LucideIcon } from "lucide-react";
import { WeatherSparkline } from "../weather-sparkline";
import { normalizeWindDirection } from "@/features/weather/lib/normalize-weather";
import {
  chanceLabel, daylightMinutes, durationLabel, localWeatherTime, nextNight,
  rainAmount, temperature, upcomingHours, weatherChartPoints, weatherClock,
} from "@/features/weather/lib/weather-presentation";
import type { WeatherData } from "@/features/weather/types/weather";
import type { WeatherDetailSelection, WeatherMetric } from "@/features/weather/types/weather-detail";
import styles from "../weather-experience/weather-experience.module.css";

interface MetricCardData {
  metric: WeatherMetric; title: string; Icon: LucideIcon; value: string;
  unit?: string; subtitle: string; footnote: string;
}

export function DaylightGraphic({ sunrise, sunset }: { sunrise: string | null; sunset: string | null }) {
  if (!sunrise || !sunset) return <span className={styles.sparklineEmpty}>Sunrise / sunset unavailable</span>;
  const position = (time: string) => (Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16))) / 1440 * 200;
  // This is a 24-hour timeline of astronomical times, not a sunshine forecast.
  return <svg viewBox="0 0 200 55" className={styles.daylightGraphic} aria-hidden="true">
    <line x1="1" x2="199" y1="28" y2="28" stroke="var(--weather-border)" strokeWidth="8" strokeLinecap="round" />
    <line x1={position(sunrise)} x2={position(sunset)} y1="28" y2="28" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    <circle cx={position(sunrise)} cy="28" r="6" fill="var(--weather-gold)" stroke="var(--weather-surface)" strokeWidth="2" />
    <circle cx={position(sunset)} cy="28" r="6" fill="var(--weather-gold)" stroke="var(--weather-surface)" strokeWidth="2" />
  </svg>;
}

export function WeatherMetricGrid({ weather, asOf, onOpen }: {
  weather: WeatherData; asOf: number; onOpen: (selection: WeatherDetailSelection) => void;
}) {
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
      value: rainAmount(today?.precipitationSum), unit: "mm", subtitle: "Today's total forecast",
      footnote: today?.precipitationProbability != null ? `${Math.round(today.precipitationProbability)}% ${chanceLabel(today.precipitationProbabilityKind).toLowerCase()}` : "Chance unavailable" },
    { metric: "wind", title: "Wind & gusts", Icon: Wind,
      value: String(Math.round(current.windSpeed)), unit: "km/h", subtitle: `From ${wind.cardinal} · ${currentLabel}`,
      footnote: `Gusts ${Math.round(current.windGusts)} km/h now` },
    { metric: "temperature", title: "Temperature", Icon: Thermometer,
      value: temperature(current.temperature), subtitle: `Feels like ${temperature(current.feelsLike)}`,
      footnote: today ? `Today's forecast ${temperature(today.temperatureMin)} to ${temperature(today.temperatureMax)}` : "Daily range unavailable" },
    { metric: "humidity", title: "Humidity", Icon: Droplets,
      value: `${Math.round(current.humidity)}%`, subtitle: `Relative humidity · ${currentLabel}`,
      footnote: "Air humidity, not soil moisture" },
    { metric: "overnight", title: "Night low", Icon: Moon,
      value: temperature(low), subtitle: current.isDay ? "Next night · Forecast" : "Rest of night · Forecast",
      footnote: low === null ? "Night forecast unavailable" : low <= 0 ? "Air temperature forecast at or below 0°C" : "Open the night temperature chart" },
    { metric: "dewPoint", title: "Dew point", Icon: Waves,
      value: temperature(current.dewPoint), subtitle: current.dewPoint === null ? "Current reading unavailable" : currentLabel,
      footnote: "Compare dew point with air temperature" },
    { metric: "daylight", title: "Daylight", Icon: Sunrise,
      value: durationLabel(daylightMinutes(today)), subtitle: `Sunrise ${weatherClock(today?.sunrise ?? null)}`,
      footnote: `Sunset ${weatherClock(today?.sunset ?? null)} · Local time` },
    { metric: "pressure", title: "Pressure", Icon: Gauge,
      value: String(Math.round(current.pressure)), unit: "hPa", subtitle: currentLabel,
      footnote: "Open the hourly pressure trend" },
  ];

  return <>
    <div className={styles.metricHeading}><h2>Conditions for your field</h2><p>Tap a card for hourly details</p></div>
    <div className={styles.metricGrid}>
      {cards.map(({ metric, title, Icon, value, unit, subtitle, footnote }) => (
        <button type="button" key={metric} className={`${styles.glass} ${styles.metricCard}`} data-metric={metric}
          onClick={() => onOpen({ metric, date: metric === "overnight" ? night[0]?.time.slice(0, 10) ?? todayKey : todayKey })}
          aria-label={`${title}: ${value}${unit ? ` ${unit}` : ""}. ${subtitle}. Open chart and details`}>
          <span className={styles.sectionTitle}><span><Icon />{title}</span><ChevronRight size={14} /></span>
          <span className={styles.metricValue}>{value}{unit && <> <small>{unit}</small></>}</span>
          <span className={styles.metricSubtitle}>{subtitle}</span>
          {metric === "daylight" ? <DaylightGraphic sunrise={today?.sunrise ?? null} sunset={today?.sunset ?? null} />
            : <WeatherSparkline points={weatherChartPoints(metric === "overnight" ? night : hours, metric)} metric={metric} />}
          <span className={styles.metricFootnote}>{footnote}</span>
        </button>
      ))}
    </div>
  </>;
}
