import type { WeatherData } from "../types/weather";
import { localWeatherTime } from "./weather-presentation";

/** Calendar days at the farm, independent of the server's timezone or DST. */
export function forecastDateWindow(timezone: string, asOf: number) {
  const today = localWeatherTime(timezone, asOf).slice(0, 10);
  const midnight = Date.parse(`${today}T00:00:00Z`);
  return Array.from({ length: 10 }, (_, index) =>
    new Date(midnight + index * 86_400_000).toISOString().slice(0, 10));
}

export function needsForecastExtension(weather: WeatherData, asOf: number) {
  const dates = new Set(weather.daily.map((day) => day.date));
  return forecastDateWindow(weather.timezone, asOf).some((date) => !dates.has(date));
}

/** Extend whole calendar days; never replace a primary day's totals or hours. */
export function extendWeatherForecast(
  primary: WeatherData,
  extension: WeatherData | null,
  asOf: number,
  attempted = true,
): WeatherData {
  const dates = forecastDateWindow(primary.timezone, asOf);
  const primaryDays = new Map(primary.daily.map((day) => [day.date, day]));
  const lastPrimaryDate = primary.daily.map((day) => day.date).sort().at(-1) ?? "";
  const compatible = extension?.timezone === primary.timezone ? extension : null;
  const extraDays = new Map(compatible?.daily.map((day) => [day.date, day]));
  const daily = dates.flatMap((date) => {
    const own = primaryDays.get(date);
    if (own) return [{ ...own, source: primary.forecastSource }];
    const extra = date > lastPrimaryDate ? extraDays.get(date) : undefined;
    return extra && compatible ? [{ ...extra, source: compatible.forecastSource }] : [];
  });
  const selectedSources = new Map(daily.map((day) => [day.date, day.source]));
  const seen = new Set<string>();
  const hourly = [primary, ...(compatible ? [compatible] : [])].flatMap((weather) =>
    weather.hourly.filter((hour) => selectedSources.get(hour.time.slice(0, 10)) === weather.forecastSource)
      .map((hour) => ({ ...hour, source: weather.forecastSource })))
    .filter((hour) => {
      const key = String(hour.timeEpoch ?? hour.time);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => a.time.localeCompare(b.time) || (a.timeEpoch ?? 0) - (b.timeEpoch ?? 0));

  return {
    ...primary, daily, hourly,
    ...(attempted ? { forecastExtensionStatus: daily.length === 10 ? "available" as const : "unavailable" as const } : {}),
  };
}
