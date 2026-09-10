import type { DailyWeather, HourlyWeather, WeatherData, WeatherSource } from "../types/weather";
import type { WeatherChartPoint, WeatherMetric } from "../types/weather-detail";

export function localWeatherTime(timezone: string, time: number) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(time);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function forecastDays(weather: WeatherData, asOf: number) {
  const today = localWeatherTime(weather.timezone, asOf).slice(0, 10);
  return weather.daily.filter((day) => day.date >= today).slice(0, 10);
}

export function upcomingHours(weather: WeatherData, asOf: number, count = 24) {
  const end = asOf + count * 3_600_000;
  const startKey = localWeatherTime(weather.timezone, asOf);
  const endKey = localWeatherTime(weather.timezone, end);
  return weather.hourly.filter((hour) => hour.timeEpoch !== undefined
    ? hour.timeEpoch * 1000 > asOf && hour.timeEpoch * 1000 <= end
    : hour.time > startKey && hour.time <= endKey).slice(0, count);
}

export function weatherDayLabel(date: string, today?: string, long = false) {
  if (date === today) return "Today";
  return new Intl.DateTimeFormat("en", {
    timeZone: "UTC", weekday: long ? "long" : "short",
    ...(long ? { month: "short", day: "numeric" } as const : {}),
  }).format(new Date(`${date}T12:00:00Z`));
}

export function weatherClock(time: string | null) {
  return time?.slice(11, 16) || "—";
}

export function temperature(value: number | null | undefined) {
  return value == null ? "—" : `${Math.round(value)}°`;
}

export function rainAmount(value: number | null | undefined) {
  if (value == null) return "—";
  if (value > 0 && value < 0.1) return "<0.1";
  return value.toFixed(1);
}

export function chanceLabel(kind: HourlyWeather["precipitationProbabilityKind"]) {
  return kind === "rain" ? "Rain chance" : kind === "snow" ? "Snow chance" : "Precipitation chance";
}

export function sourceName(weather: WeatherData, entry?: { source?: WeatherSource }) {
  return (entry?.source ?? weather.forecastSource) === "weatherapi" ? "WeatherAPI" : "Open-Meteo";
}

export function forecastSourceNames(weather: WeatherData, entries: { source?: WeatherSource }[] = weather.daily) {
  return [...new Set(entries.map((entry) => sourceName(weather, entry)))].join(" + ") || sourceName(weather);
}

export function daylightMinutes(day: DailyWeather | null | undefined): number | null {
  if (!day?.sunrise || !day.sunset) return null;
  // Both are local timestamps on the same provider's calendar, not browser dates.
  const minutes = (time: string) => Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16));
  const span = minutes(day.sunset) - minutes(day.sunrise);
  return span > 0 && span <= 24 * 60 ? span : null;
}

export function durationLabel(minutes: number | null) {
  return minutes === null ? "—" : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function nextNight(hours: HourlyWeather[]) {
  const start = hours.findIndex((hour) => !hour.isDay);
  if (start < 0) return [];
  const end = hours.findIndex((hour, index) => index > start && hour.isDay);
  return hours.slice(start, end < 0 ? undefined : end);
}

/** A night can cross midnight; keep its chart aligned with the night-low card. */
export function nightForecast(weather: WeatherData, asOf: number, date: string) {
  const upcomingNight = nextNight(upcomingHours(weather, asOf));
  if (upcomingNight[0]?.time.startsWith(date)) return upcomingNight;
  const onDate = weather.hourly.filter((hour) => hour.time.startsWith(date));
  const firstDay = onDate.findIndex((hour) => hour.isDay);
  const start = onDate.find((hour, index) => !hour.isDay && index > firstDay);
  return start ? nextNight(weather.hourly.slice(weather.hourly.indexOf(start))) : [];
}

export function fieldOutlook(hours: HourlyWeather[]) {
  if (!hours.length) return "Hourly forecast is currently unavailable.";
  const wet = hours.find((hour) => hour.precipitation !== null && hour.precipitation > 0);
  const gust = Math.max(...hours.map((hour) => hour.windGusts));
  const rain = wet
    ? `Precipitation appears in the ${weatherClock(wet.time)} hourly forecast.`
    : hours.every((hour) => hour.precipitation !== null)
      ? "No measurable precipitation in the available hourly forecast."
      : "Some hourly precipitation amounts are unavailable.";
  return `${rain} Forecast gusts reach ${Math.round(gust)} km/h.`;
}

export const WEATHER_METRICS: Record<WeatherMetric, { title: string; unit: string; description: string }> = {
  precipitation: {
    title: "Precipitation", unit: "mm",
    description: "Hourly forecast amounts. Today's total is the provider's forecast for the full local calendar day; it is not a rain-gauge measurement or the amount that has already fallen.",
  },
  wind: {
    title: "Wind & gusts", unit: "km/h",
    description: "Sustained wind and short gusts can differ substantially. Check both when planning field work; these forecasts do not establish safe spraying conditions.",
  },
  temperature: {
    title: "Temperature", unit: "°C",
    description: "Air temperature and feels-like temperature. The main Now reading is the provider's latest report; this chart contains hourly forecasts, including earlier forecast hours.",
  },
  humidity: {
    title: "Humidity", unit: "%",
    description: "Relative humidity of the air. Soil moisture and leaf wetness need separate measurements and are not inferred from this percentage.",
  },
  dewPoint: {
    title: "Dew point", unit: "°C",
    description: "The temperature at which air becomes saturated. A small gap between air temperature and dew point can support condensation; it does not confirm wet leaves.",
  },
  overnight: {
    title: "Night temperature", unit: "°C",
    description: "Forecast air temperature with a {value} reference. Ground frost can occur at a different air temperature; sensitivity depends on the crop and its growth stage.",
  },
  daylight: {
    title: "Daylight", unit: "",
    description: "Sunrise and sunset at this location, shown in the farm's local time. Daylight duration is not the number of hours of direct sunshine.",
  },
  pressure: {
    title: "Pressure", unit: "hPa",
    description: "Atmospheric pressure as reported by the selected provider. The chart shows the forecast trend, not a measured pressure history.",
  },
  cloudCover: {
    title: "Cloud cover", unit: "%",
    description: "The forecast fraction of sky covered by cloud. Cloud cover alone does not measure the sunlight reaching a crop.",
  },
};

export function weatherChartPoints(hours: HourlyWeather[], metric: WeatherMetric): WeatherChartPoint[] {
  return hours.map((hour) => {
    let value: number | null;
    let secondary: number | null = null;
    switch (metric) {
      case "precipitation": value = hour.precipitation; break;
      case "wind": value = hour.windSpeed; secondary = hour.windGusts; break;
      case "humidity": value = hour.humidity; break;
      case "dewPoint": value = hour.dewPoint; secondary = hour.temperature; break;
      case "pressure": value = hour.pressure; break;
      case "cloudCover": value = hour.cloudCover; break;
      default: value = hour.temperature; secondary = hour.feelsLike;
    }
    return {
      key: String(hour.timeEpoch ?? hour.time), time: hour.time,
      source: hour.source,
      position: hour.timeEpoch ?? Date.parse(`${hour.time}Z`) / 1000,
      value, secondary,
    };
  });
}
