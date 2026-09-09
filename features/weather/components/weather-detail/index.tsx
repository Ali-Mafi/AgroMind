"use client";

import { useMemo, useState } from "react";
import { WeatherChart } from "../weather-chart";
import { DaylightGraphic } from "../weather-metric-grid";
import { normalizeWindDirection } from "@/features/weather/lib/normalize-weather";
import {
  WEATHER_METRICS, chanceLabel, daylightMinutes, durationLabel, forecastDays, forecastSourceNames,
  localWeatherTime, nightForecast, rainAmount, sourceName, temperature, weatherChartPoints,
  weatherClock, weatherDayLabel,
} from "@/features/weather/lib/weather-presentation";
import type { WeatherData } from "@/features/weather/types/weather";
import type { WeatherDetailSelection, WeatherMetric } from "@/features/weather/types/weather-detail";
import styles from "../weather-experience/weather-experience.module.css";

interface WeatherDetailProps {
  weather: WeatherData;
  asOf: number;
  selection: WeatherDetailSelection;
  onSelection: (selection: WeatherDetailSelection) => void;
}

const METRICS = Object.keys(WEATHER_METRICS) as WeatherMetric[];

function reading(value: number | null, metric: WeatherMetric) {
  if (value === null) return "—";
  return metric === "precipitation" ? rainAmount(value) : `${Math.round(value)}`;
}

function CurrentReading({ weather, metric }: { weather: WeatherData; metric: WeatherMetric }) {
  const { current } = weather;
  const report = current.source === "weatherapi" ? "Latest report" : "Latest model estimate";
  const time = weatherClock(localWeatherTime(weather.timezone, Date.parse(current.time)));
  let value: number | null;
  switch (metric) {
    case "temperature": case "overnight": value = current.temperature; break;
    case "wind": value = current.windSpeed; break;
    case "humidity": value = current.humidity; break;
    case "dewPoint": value = current.dewPoint; break;
    case "pressure": value = current.pressure; break;
    case "cloudCover": value = current.cloudCover; break;
    default: return null;
  }
  return <p className={styles.detailNote}>{report} at {time}: <strong>{reading(value, metric)} {WEATHER_METRICS[metric].unit}</strong>{metric === "wind" && ` · Gusts ${Math.round(current.windGusts)} km/h · From ${normalizeWindDirection(current.windDirection).cardinal}`}.</p>;
}

function HourlyDetail({ weather, asOf, selection }: Omit<WeatherDetailProps, "onSelection">) {
  const { metric, date, hour: initialHour } = selection;
  const day = weather.daily.find((entry) => entry.date === date);
  const hours = useMemo(() => metric === "overnight" ? nightForecast(weather, asOf, date)
    : weather.hourly.filter((hour) => hour.time.startsWith(date)), [weather, asOf, date, metric]);
  const points = useMemo(() => weatherChartPoints(hours, metric), [hours, metric]);
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const exact = initialHour ? hours.findIndex((hour) => hour.time === initialHour) : -1;
    if (exact >= 0) return exact;
    const nowKey = localWeatherTime(weather.timezone, asOf);
    const next = hours.findIndex((hour) => hour.timeEpoch !== undefined ? hour.timeEpoch * 1000 >= asOf : hour.time >= nowKey);
    return next >= 0 ? next : Math.max(0, hours.length - 1);
  });
  const index = Math.min(selectedIndex, Math.max(0, points.length - 1));
  const selected = points[index];
  const hour = hours[index];
  const secondaryLabel = metric === "wind" ? "Gusts" : metric === "dewPoint" ? "Air temperature" : "Feels like";
  const showSecondary = points.some((point) => point.secondary !== null);
  const primaryLabel = metric === "wind" ? "Wind" : WEATHER_METRICS[metric].title;
  const nightHours = hours.filter((entry) => !entry.isDay);

  return <div data-metric={metric}>
    <CurrentReading weather={weather} metric={metric} />
    {selected && <div className={styles.selectedReading}>
      <div>
        <p>{weatherClock(selected.time)}{selected.time.slice(0, 10) !== date ? ` · ${weatherDayLabel(selected.time.slice(0, 10))}` : ""} · Hourly forecast · {sourceName(weather, hour)}</p>
        <strong className={styles.selectedValue}>{reading(selected.value, metric)} <small>{WEATHER_METRICS[metric].unit}</small></strong>
      </div>
      <div className={styles.selectedAside}>
        {metric === "precipitation" && hour && <p>{hour.precipitationProbability !== null ? `${Math.round(hour.precipitationProbability)}% ${chanceLabel(hour.precipitationProbabilityKind).toLowerCase()}` : "Chance unavailable"}</p>}
        {showSecondary && <p>{secondaryLabel} {reading(selected.secondary, metric)} {WEATHER_METRICS[metric].unit}</p>}
        {metric === "wind" && hour && <p>From {normalizeWindDirection(hour.windDirection).cardinal}</p>}
        {metric === "humidity" && hour && <p>Dew point {temperature(hour.dewPoint)}</p>}
        {metric === "overnight" && hour && <p>{hour.isDay ? "Daytime" : "Nighttime"}</p>}
      </div>
    </div>}

    <WeatherChart points={points} metric={metric} selectedIndex={index} onSelect={setSelectedIndex} />
    <div className={styles.legend}>
      <span><i />{primaryLabel}</span>
      {showSecondary && <span><i className={styles.secondaryLegend} />{secondaryLabel}</span>}
    </div>

    {metric === "precipitation" && <div className={styles.detailStats}>
      <div className={styles.detailStat}>
        <span>Full-day forecast · {date}</span>
        <strong>{rainAmount(day?.precipitationSum)} mm</strong>
        <small>{day?.precipitationProbability != null ? `${Math.round(day.precipitationProbability)}% ${chanceLabel(day.precipitationProbabilityKind).toLowerCase()}` : "Chance unavailable"}</small>
      </div>
      <div className={styles.detailStat}>
        <span>Measured daily total</span>
        <strong>Unavailable</strong>
        <small>No rain-gauge observation is connected to this farm.</small>
      </div>
    </div>}
    {metric === "precipitation" && weather.current.precipitation !== null && <p className={styles.detailNote}>
      Latest {weather.current.source === "open-meteo" ? "model estimate" : "provider report"}: {rainAmount(weather.current.precipitation)} mm
      {weather.current.intervalSeconds !== null
        ? ` over the previous ${Math.round(weather.current.intervalSeconds / 60)} minutes.`
        : ". The provider does not specify this reading's accumulation period, so it is not used as today's total."}
    </p>}

    {(metric === "temperature" || metric === "overnight") && <div className={styles.detailStats}>
      <div className={styles.detailStat}><span>{metric === "overnight" ? "Available night forecast low" : "Daily forecast low"}</span>
        <strong>{metric === "overnight" ? temperature(nightHours.length ? Math.min(...nightHours.map((entry) => entry.temperature)) : null) : temperature(day?.temperatureMin)}</strong>
        {metric === "overnight" && <small>Includes available hours across midnight, until the next daylight forecast.</small>}
      </div>
      <div className={styles.detailStat}><span>{metric === "overnight" ? "Forecast readings at or below 0°C" : "Daily forecast high"}</span>
        <strong>{metric === "overnight" ? (hours.length ? hours.filter((entry) => entry.temperature <= 0).length : "—") : temperature(day?.temperatureMax)}</strong>
        {metric === "overnight" && <small>Hourly air-temperature samples; not a ground-frost observation.</small>}
      </div>
    </div>}

    <p className={styles.detailExplanation}>{WEATHER_METRICS[metric].description}</p>
    {metric === "precipitation" && (day?.source ?? weather.forecastSource) === "open-meteo" && <p className={styles.detailNote}>Each hourly timestamp marks the end of the preceding hour&apos;s precipitation amount.</p>}
    <p className={styles.detailNote}>{forecastSourceNames(weather, hours)} · {weather.timezone} · Earlier hours on this chart remain forecasts.</p>
    {new Set(hours.map((entry) => entry.source ?? weather.forecastSource)).size > 1 && <p className={styles.detailNote}>This night spans two forecast providers. Lines stop at the provider change; each reading shows its source.</p>}

    {points.length > 0 && <details className={styles.dataDisclosure}>
      <summary>View hourly values</summary>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <caption className="sr-only">{WEATHER_METRICS[metric].title} forecasts for {date} in {weather.timezone}</caption>
          <thead><tr><th scope="col">Local time</th><th scope="col">{primaryLabel} ({WEATHER_METRICS[metric].unit})</th>
            {showSecondary && <th scope="col">{secondaryLabel}</th>}
            {metric === "precipitation" && <th scope="col">Chance</th>}
            {metric === "wind" && <th scope="col">From</th>}
            <th scope="col">Source</th>
          </tr></thead>
          <tbody>{points.map((point, row) => <tr key={point.key} aria-selected={row === index}>
            <th scope="row">{metric === "overnight" ? `${point.time.slice(5, 10)} ` : ""}{weatherClock(point.time)}{hours[row].timeEpoch !== undefined && <span className="sr-only"> {new Date(hours[row].timeEpoch! * 1000).toISOString()}</span>}</th>
            <td>{reading(point.value, metric)}</td>
            {showSecondary && <td>{reading(point.secondary, metric)}</td>}
            {metric === "precipitation" && <td>{hours[row].precipitationProbability !== null ? `${Math.round(hours[row].precipitationProbability!)}% ${chanceLabel(hours[row].precipitationProbabilityKind).replace(" chance", "")}` : "—"}</td>}
            {metric === "wind" && <td>{normalizeWindDirection(hours[row].windDirection).cardinal}</td>}
            <td>{sourceName(weather, hours[row])}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </details>}
  </div>;
}

export function WeatherDetail({ weather, asOf, selection, onSelection }: WeatherDetailProps) {
  const todayKey = localWeatherTime(weather.timezone, asOf).slice(0, 10);
  const days = forecastDays(weather, asOf);
  // Keep an open sheet useful if a refresh crosses midnight or the provider changes.
  const date = days.some((day) => day.date === selection.date) ? selection.date : days[0]?.date ?? todayKey;
  const day = days.find((entry) => entry.date === date);
  return <>
    <div className={styles.dateChips} role="group" aria-label="Forecast day">
      {days.map((entry) => <button type="button" key={entry.date} className={styles.dateChip}
        aria-pressed={entry.date === date} onClick={() => onSelection({ metric: selection.metric, date: entry.date })}>
        {weatherDayLabel(entry.date, todayKey)}<small>{entry.date.slice(5)}</small>
      </button>)}
    </div>
    <div className={styles.metricChips} role="group" aria-label="Weather measurement">
      {METRICS.map((metric) => <button type="button" key={metric} className={styles.metricChip}
        aria-pressed={selection.metric === metric} onClick={() => onSelection({ metric, date })}>
        {WEATHER_METRICS[metric].title}
      </button>)}
    </div>
    {selection.metric === "daylight" ? <div data-metric="daylight">
      <div className={styles.selectedReading}><div><p>Daylight duration · {weatherDayLabel(date, todayKey)}</p><strong className={styles.selectedValue}>{durationLabel(daylightMinutes(day))}</strong></div></div>
      <DaylightGraphic sunrise={day?.sunrise ?? null} sunset={day?.sunset ?? null} />
      <div className={styles.detailStats}>
        <div className={styles.detailStat}><span>Sunrise</span><strong>{weatherClock(day?.sunrise ?? null)}</strong></div>
        <div className={styles.detailStat}><span>Sunset</span><strong>{weatherClock(day?.sunset ?? null)}</strong></div>
      </div>
      <p className={styles.detailExplanation}>{WEATHER_METRICS.daylight.description}</p>
      <p className={styles.detailNote}>{sourceName(weather, day)} · {weather.timezone}</p>
      <div className={styles.tableWrap}><table className={styles.dataTable}>
        <caption className="sr-only">Daily sunrise, sunset and daylight at this farm</caption>
        <thead><tr><th scope="col">Day</th><th scope="col">Sunrise</th><th scope="col">Sunset</th><th scope="col">Duration</th><th scope="col">Source</th></tr></thead>
        <tbody>{days.map((entry) => <tr key={entry.date}><th scope="row">{weatherDayLabel(entry.date, todayKey)}</th><td>{weatherClock(entry.sunrise)}</td><td>{weatherClock(entry.sunset)}</td><td>{durationLabel(daylightMinutes(entry))}</td><td>{sourceName(weather, entry)}</td></tr>)}</tbody>
      </table></div>
    </div> : <HourlyDetail key={`${weather.forecastSource}-${selection.metric}-${date}-${selection.hour ?? ""}`}
      weather={weather} asOf={asOf} selection={{ ...selection, date }} />}
  </>;
}
