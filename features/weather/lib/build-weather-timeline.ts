import type { CurrentWeather, WeatherData } from "../types/weather";

export interface WeatherTimelineCard extends Pick<CurrentWeather,
  "time" | "temperature" | "feelsLike" | "condition" | "isDay" |
  "windDirection" | "windSpeed" | "precipitationProbability"
> {
  key: string;
  kind: "current" | "forecast";
  precipitationProbabilityKind: "precipitation" | "rain" | "snow";
}

function farmHourKey(timeZone: string, time: number) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(time));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:00`;
}

export function buildWeatherTimeline(weather: WeatherData, asOf: number): WeatherTimelineCard[] {
  const hourKey = farmHourKey(weather.timezone, asOf);
  const end = asOf + 24 * 60 * 60 * 1000;
  const upcoming = weather.hourly.filter((hour) => hour.timeEpoch !== undefined
    ? hour.timeEpoch * 1000 > asOf && hour.timeEpoch * 1000 <= end
    : hour.time > hourKey).slice(0, 24);

  return [
    {
      // A distinct current card, never a forecast edited to look like an observation.
      ...weather.current,
      key: "current",
      kind: "current",
      precipitationProbabilityKind: "precipitation",
    },
    ...upcoming.map((hour): WeatherTimelineCard => ({
      ...hour,
      key: `forecast-${hour.timeEpoch ?? hour.time}`,
      kind: "forecast",
    })),
  ];
}
