import type { CurrentWeather, WeatherData } from "../types/weather";
import { upcomingHours } from "./weather-presentation";

export interface WeatherTimelineCard extends Pick<CurrentWeather,
  "time" | "temperature" | "feelsLike" | "condition" | "isDay" |
  "windDirection" | "windSpeed" | "precipitationProbability"
> {
  key: string;
  kind: "current" | "forecast";
  precipitationProbabilityKind: "precipitation" | "rain" | "snow";
}

export function buildWeatherTimeline(weather: WeatherData, asOf: number): WeatherTimelineCard[] {
  const upcoming = upcomingHours(weather, asOf);

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
