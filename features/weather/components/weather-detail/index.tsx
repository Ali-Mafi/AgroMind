"use client";

import { T } from "@/features/settings/components/translated-text";
import { useWeatherFormat } from "../hooks/use-weather-format";
import { useMemo, useState } from "react";
import { WeatherChart } from "../weather-chart";
import { DaylightGraphic } from "../weather-metric-grid";
import { normalizeWindDirection } from "@/features/weather/lib/normalize-weather";
import {
  WEATHER_METRICS, daylightMinutes, forecastDays, forecastSourceNames,
  localWeatherTime, nightForecast, sourceName, weatherChartPoints,
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

function CurrentReading({ weather, metric }: { weather: WeatherData; metric: WeatherMetric }) {
  const { reading, unit, weatherClock, measure, t } = useWeatherFormat();
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
  return <p className={styles.detailNote}>{t(report)}{" "}<T text="at" />{" "}{time}: <strong>{reading(value, metric)} {unit(metric)}</strong>{metric === "wind" && ` · ${t("Gusts")} ${measure(current.windGusts, "wind", 0)} · ${t("From")} ${normalizeWindDirection(current.windDirection).cardinal}`}.</p>;
}

function HourlyDetail({ weather, asOf, selection }: Omit<WeatherDetailProps, "onSelection">) {
  const { reading, unit, weatherClock, weatherDayLabel, temperature, rainAmount, chanceLabel, symbol, measure, shortDate, date: formatDate, number, metricDescription, t } = useWeatherFormat();
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
        <p>{weatherClock(selected.time)}{selected.time.slice(0, 10) !== date ? ` · ${weatherDayLabel(selected.time.slice(0, 10))}` : ""}{" "}<T text="· Hourly forecast ·" />{" "}{sourceName(weather, hour)}</p>
        <strong className={styles.selectedValue}>{reading(selected.value, metric)} <small>{unit(metric)}</small></strong>
      </div>
      <div className={styles.selectedAside}>
        {metric === "precipitation" && hour && <p>{hour.precipitationProbability !== null ? `${number(hour.precipitationProbability, 0)}% ${chanceLabel(hour.precipitationProbabilityKind).toLowerCase()}` : t("Chance unavailable")}</p>}
        {showSecondary && <p><T text={secondaryLabel} /> {reading(selected.secondary, metric)} {unit(metric)}</p>}
        {metric === "wind" && hour && <p><T text="From" />{" "}{normalizeWindDirection(hour.windDirection).cardinal}</p>}
        {metric === "humidity" && hour && <p><T text="Dew point" />{" "}{temperature(hour.dewPoint)}</p>}
        {metric === "overnight" && hour && <p>{hour.isDay ? t("Daytime") : t("Nighttime")}</p>}
      </div>
    </div>}

    <WeatherChart points={points} metric={metric} selectedIndex={index} onSelect={setSelectedIndex} />
    <div className={styles.legend}>
      <span><i /><T text={primaryLabel} /></span>
      {showSecondary && <span><i className={styles.secondaryLegend} /><T text={secondaryLabel} /></span>}
    </div>

    {metric === "precipitation" && <div className={styles.detailStats}>
      <div className={styles.detailStat}>
        <span><T text="Full-day forecast ·" />{" "}<time dateTime={date}>{formatDate(new Date(`${date}T12:00:00Z`), { timeZone: "UTC" })}</time></span>
        <strong>{rainAmount(day?.precipitationSum)} {symbol("precipitation")}</strong>
        <small>{day?.precipitationProbability != null ? `${number(day.precipitationProbability, 0)}% ${chanceLabel(day.precipitationProbabilityKind).toLowerCase()}` : t("Chance unavailable")}</small>
      </div>
      <div className={styles.detailStat}>
        <span><T text="Measured daily total" /></span>
        <strong><T text="Unavailable" /></strong>
        <small><T text="No rain-gauge observation is connected to this farm." /></small>
      </div>
    </div>}
    {metric === "precipitation" && weather.current.precipitation !== null && <p className={styles.detailNote}><T text="Latest" />{" "}{weather.current.source === "open-meteo" ? t("model estimate") : t("provider report")}: {rainAmount(weather.current.precipitation)} {symbol("precipitation")}
      {weather.current.intervalSeconds !== null
        ? t(" over the previous {minutes} minutes.", { minutes: number(weather.current.intervalSeconds / 60, 0) })
        : t(". The provider does not specify this reading's accumulation period, so it is not used as today's total.")}
    </p>}

    {(metric === "temperature" || metric === "overnight") && <div className={styles.detailStats}>
      <div className={styles.detailStat}><span>{metric === "overnight" ? t("Available night forecast low") : t("Daily forecast low")}</span>
        <strong>{metric === "overnight" ? temperature(nightHours.length ? Math.min(...nightHours.map((entry) => entry.temperature)) : null) : temperature(day?.temperatureMin)}</strong>
        {metric === "overnight" && <small><T text="Includes available hours across midnight, until the next daylight forecast." /></small>}
      </div>
      <div className={styles.detailStat}><span>{metric === "overnight" ? t("Forecast readings at or below {value}", { value: measure(0, "temperature", 0) }) : t("Daily forecast high")}</span>
        <strong>{metric === "overnight" ? (hours.length ? hours.filter((entry) => entry.temperature <= 0).length : "—") : temperature(day?.temperatureMax)}</strong>
        {metric === "overnight" && <small><T text="Hourly air-temperature samples; not a ground-frost observation." /></small>}
      </div>
    </div>}

    <p className={styles.detailExplanation}>{metricDescription(metric)}</p>
    {metric === "precipitation" && (day?.source ?? weather.forecastSource) === "open-meteo" && <p className={styles.detailNote}><T text="Each hourly timestamp marks the end of the preceding hour's precipitation amount." /></p>}
    <p className={styles.detailNote}>{forecastSourceNames(weather, hours)} · {weather.timezone}{" "}<T text="· Earlier hours on this chart remain forecasts." /></p>
    {new Set(hours.map((entry) => entry.source ?? weather.forecastSource)).size > 1 && <p className={styles.detailNote}><T text="This night spans two forecast providers. Lines stop at the provider change; each reading shows its source." /></p>}

    {points.length > 0 && <details className={styles.dataDisclosure}>
      <summary><T text="View hourly values" /></summary>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <caption className="sr-only">{t(WEATHER_METRICS[metric].title)}{" "}<T text="forecasts for" />{" "}{date}{" "}<T text="in" />{" "}{weather.timezone}</caption>
          <thead><tr><th scope="col"><T text="Local time" /></th><th scope="col"><T text={primaryLabel} /> ({unit(metric)})</th>
            {showSecondary && <th scope="col"><T text={secondaryLabel} /></th>}
            {metric === "precipitation" && <th scope="col"><T text="Chance" /></th>}
            {metric === "wind" && <th scope="col"><T text="From" /></th>}
            <th scope="col"><T text="Source" /></th>
          </tr></thead>
          <tbody>{points.map((point, row) => <tr key={point.key} aria-selected={row === index}>
            <th scope="row">{metric === "overnight" ? `${shortDate(point.time.slice(0, 10))} ` : ""}{weatherClock(point.time)}{hours[row].timeEpoch !== undefined && <span className="sr-only"> {new Date(hours[row].timeEpoch! * 1000).toISOString()}</span>}</th>
            <td>{reading(point.value, metric)}</td>
            {showSecondary && <td>{reading(point.secondary, metric)}</td>}
            {metric === "precipitation" && <td>{hours[row].precipitationProbability !== null ? `${number(hours[row].precipitationProbability!, 0)}% ${chanceLabel(hours[row].precipitationProbabilityKind).replace(" chance", "")}` : "—"}</td>}
            {metric === "wind" && <td>{normalizeWindDirection(hours[row].windDirection).cardinal}</td>}
            <td>{sourceName(weather, hours[row])}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </details>}
  </div>;
}

export function WeatherDetail({ weather, asOf, selection, onSelection }: WeatherDetailProps) {
  const { weatherClock, weatherDayLabel, shortDate, durationLabel, t } = useWeatherFormat();
  const todayKey = localWeatherTime(weather.timezone, asOf).slice(0, 10);
  const days = forecastDays(weather, asOf);
  // Keep an open sheet useful if a refresh crosses midnight or the provider changes.
  const date = days.some((day) => day.date === selection.date) ? selection.date : days[0]?.date ?? todayKey;
  const day = days.find((entry) => entry.date === date);
  return <>
    <div className={styles.dateChips} role="group" aria-label={t("Forecast day")}>
      {days.map((entry) => <button type="button" key={entry.date} className={styles.dateChip}
        aria-pressed={entry.date === date} onClick={() => onSelection({ metric: selection.metric, date: entry.date })}>
        {weatherDayLabel(entry.date, todayKey)}<small>{shortDate(entry.date)}</small>
      </button>)}
    </div>
    <div className={styles.metricChips} role="group" aria-label={t("Weather measurement")}>
      {METRICS.map((metric) => <button type="button" key={metric} className={styles.metricChip}
        aria-pressed={selection.metric === metric} onClick={() => onSelection({ metric, date })}>
        {WEATHER_METRICS[metric].title}
      </button>)}
    </div>
    {selection.metric === "daylight" ? <div data-metric="daylight">
      <div className={styles.selectedReading}><div><p><T text="Daylight duration ·" />{" "}{weatherDayLabel(date, todayKey)}</p><strong className={styles.selectedValue}>{durationLabel(daylightMinutes(day))}</strong></div></div>
      <DaylightGraphic sunrise={day?.sunrise ?? null} sunset={day?.sunset ?? null} />
      <div className={styles.detailStats}>
        <div className={styles.detailStat}><span><T text="Sunrise" /></span><strong>{weatherClock(day?.sunrise ?? null)}</strong></div>
        <div className={styles.detailStat}><span><T text="Sunset" /></span><strong>{weatherClock(day?.sunset ?? null)}</strong></div>
      </div>
      <p className={styles.detailExplanation}>{t(WEATHER_METRICS.daylight.description)}</p>
      <p className={styles.detailNote}>{sourceName(weather, day)} · {weather.timezone}</p>
      <div className={styles.tableWrap}><table className={styles.dataTable}>
        <caption className="sr-only"><T text="Daily sunrise, sunset and daylight at this farm" /></caption>
        <thead><tr><th scope="col"><T text="Day" /></th><th scope="col"><T text="Sunrise" /></th><th scope="col"><T text="Sunset" /></th><th scope="col"><T text="Duration" /></th><th scope="col"><T text="Source" /></th></tr></thead>
        <tbody>{days.map((entry) => <tr key={entry.date}><th scope="row">{weatherDayLabel(entry.date, todayKey)}</th><td>{weatherClock(entry.sunrise)}</td><td>{weatherClock(entry.sunset)}</td><td>{durationLabel(daylightMinutes(entry))}</td><td>{sourceName(weather, entry)}</td></tr>)}</tbody>
      </table></div>
    </div> : <HourlyDetail key={`${weather.forecastSource}-${selection.metric}-${date}-${selection.hour ?? ""}`}
      weather={weather} asOf={asOf} selection={{ ...selection, date }} />}
  </>;
}
