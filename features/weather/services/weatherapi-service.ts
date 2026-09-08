import "server-only";

import { normalizeWeatherApiCondition } from "@/features/weather/lib/normalize-weatherapi";
import type {
  CurrentWeather,
  DailyWeather,
  HourlyWeather,
  WeatherCoordinates,
  WeatherData,
} from "@/features/weather/types/weather";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid WeatherAPI response.");
  }
  return value as Record<string, unknown>;
}

function requiredNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Missing WeatherAPI measurement.");
  }
  return value;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseWeatherApiCurrent(payload: unknown): {
  current: CurrentWeather;
  timezone: string;
} {
  const data = record(payload);
  const location = record(data.location);
  const raw = record(data.current);
  const condition = record(raw.condition);
  if (
    typeof condition.text !== "string" || !condition.text.trim() ||
    typeof location.tz_id !== "string" ||
    (raw.is_day !== 0 && raw.is_day !== 1)
  ) {
    throw new Error("Invalid WeatherAPI response.");
  }
  // Reject invalid timezones before the UI uses Intl.DateTimeFormat.
  new Intl.DateTimeFormat("en", { timeZone: location.tz_id });
  const epoch = requiredNumber(raw.last_updated_epoch);
  if (epoch <= 0) throw new Error("Missing WeatherAPI report time.");

  return {
    timezone: location.tz_id,
    current: {
      source: "weatherapi",
      time: new Date(epoch * 1000).toISOString(),
      // The current.json docs do not specify precip_mm's accumulation period.
      intervalSeconds: null,
      temperature: requiredNumber(raw.temp_c),
      feelsLike: requiredNumber(raw.feelslike_c),
      humidity: requiredNumber(raw.humidity),
      dewPoint: optionalNumber(raw.dewpoint_c),
      precipitation: optionalNumber(raw.precip_mm),
      precipitationProbability: null,
      rain: null,
      showers: null,
      snowfall: null,
      condition: normalizeWeatherApiCondition(
        requiredNumber(condition.code), condition.text.trim(),
      ),
      isDay: raw.is_day === 1,
      cloudCover: requiredNumber(raw.cloud),
      pressure: requiredNumber(raw.pressure_mb),
      surfacePressure: null,
      visibility: requiredNumber(raw.vis_km) * 1000,
      windSpeed: requiredNumber(raw.wind_kph),
      windDirection: requiredNumber(raw.wind_degree),
      windGusts: requiredNumber(raw.gust_kph),
    },
  };
}

function parseCondition(value: unknown) {
  const condition = record(value);
  if (typeof condition.text !== "string" || !condition.text.trim()) {
    throw new Error("Missing WeatherAPI condition.");
  }
  return normalizeWeatherApiCondition(requiredNumber(condition.code), condition.text.trim());
}

function percentage(value: unknown): number | null {
  // Some WeatherAPI responses encode probabilities as numeric strings.
  const parsed = typeof value === "string" && /^\d{1,3}$/.test(value)
    ? Number(value) : optionalNumber(value);
  return parsed !== null && parsed >= 0 && parsed <= 100 ? parsed : null;
}

function precipitationChance(rain: unknown, snow: unknown): Pick<
  HourlyWeather, "precipitationProbability" | "precipitationProbabilityKind"
> {
  const rainChance = percentage(rain);
  const snowChance = percentage(snow);
  // Display one explicitly named event; this is not a combined probability.
  return snowChance !== null && (rainChance === null || snowChance > rainChance)
    ? { precipitationProbability: snowChance, precipitationProbabilityKind: "snow" }
    : { precipitationProbability: rainChance, precipitationProbabilityKind: "rain" };
}

function astronomyTime(date: string, value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(value);
  if (!match) return null; // Polar day/night may have no sunrise or sunset.
  const hour = Number(match[1]);
  if (hour < 1 || hour > 12 || Number(match[2]) > 59) return null;
  const hour24 = hour % 12 + (match[3] === "PM" ? 12 : 0);
  return `${date}T${String(hour24).padStart(2, "0")}:${match[2]}`;
}

function parseHour(value: unknown): HourlyWeather {
  const raw = record(value);
  const timeEpoch = requiredNumber(raw.time_epoch);
  if (typeof raw.time !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(raw.time) ||
    timeEpoch <= 0 || !Number.isFinite(new Date(timeEpoch * 1000).getTime()) ||
    (raw.is_day !== 0 && raw.is_day !== 1)) {
    throw new Error("Invalid WeatherAPI hourly time.");
  }
  return {
    time: raw.time.replace(" ", "T"),
    timeEpoch,
    temperature: requiredNumber(raw.temp_c),
    feelsLike: requiredNumber(raw.feelslike_c),
    humidity: requiredNumber(raw.humidity),
    dewPoint: optionalNumber(raw.dewpoint_c),
    ...precipitationChance(raw.chance_of_rain, raw.chance_of_snow),
    precipitation: optionalNumber(raw.precip_mm),
    rain: null,
    showers: null,
    snowfall: optionalNumber(raw.snow_cm),
    condition: parseCondition(raw.condition),
    isDay: raw.is_day === 1,
    cloudCover: requiredNumber(raw.cloud),
    visibility: requiredNumber(raw.vis_km) * 1000,
    pressure: requiredNumber(raw.pressure_mb),
    windSpeed: requiredNumber(raw.wind_kph),
    windDirection: requiredNumber(raw.wind_degree),
    windGusts: requiredNumber(raw.gust_kph),
  };
}

export function parseWeatherApiForecast(payload: unknown, coordinates: WeatherCoordinates): WeatherData {
  const data = record(payload);
  const report = parseWeatherApiCurrent(payload);
  const forecast = record(data.forecast);
  if (!Array.isArray(forecast.forecastday) || forecast.forecastday.length === 0) {
    throw new Error("Missing WeatherAPI forecast.");
  }

  const hourly: HourlyWeather[] = [];
  const daily: DailyWeather[] = forecast.forecastday.map((value: unknown) => {
    const raw = record(value);
    const day = record(raw.day);
    const astro = record(raw.astro);
    if (typeof raw.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date) ||
      !Array.isArray(raw.hour) || raw.hour.length === 0) {
      throw new Error("Incomplete WeatherAPI forecast.");
    }
    hourly.push(...raw.hour.map(parseHour));
    return {
      date: raw.date,
      temperatureMax: requiredNumber(day.maxtemp_c),
      temperatureMin: requiredNumber(day.mintemp_c),
      feelsLikeMax: null,
      feelsLikeMin: null,
      ...precipitationChance(day.daily_chance_of_rain, day.daily_chance_of_snow),
      precipitationSum: requiredNumber(day.totalprecip_mm),
      rainSum: null,
      showersSum: null,
      snowfallSum: optionalNumber(day.totalsnow_cm),
      condition: parseCondition(day.condition),
      windSpeedMax: requiredNumber(day.maxwind_kph),
      windGustsMax: null,
      windDirectionDominant: null,
      sunrise: astronomyTime(raw.date, astro.sunrise),
      sunset: astronomyTime(raw.date, astro.sunset),
      uvIndexMax: optionalNumber(day.uv),
    };
  });

  return {
    coordinates,
    current: report.current,
    currentStatus: "primary",
    forecastSource: "weatherapi",
    forecastStatus: "available",
    timezone: report.timezone,
    timezoneAbbreviation: report.timezone,
    utcOffsetSeconds: null,
    elevation: null,
    hourly: hourly.sort((a, b) => a.timeEpoch! - b.timeEpoch!),
    daily: daily.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function getWeatherApiWeather(
  coordinates: WeatherCoordinates,
  apiKey: string,
) {
  const params = new URLSearchParams({
    key: apiKey,
    q: `${coordinates.latitude},${coordinates.longitude}`,
    aqi: "no",
    lang: "en",
    // Today's remaining hours plus the next days cover a rolling 24-hour strip.
    // Three forecast days are supported by the Free plan.
    days: "3",
    alerts: "no",
  });

  const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    // Never expose the upstream URL, API key, or response body to the client.
    throw new Error("WeatherAPI is unavailable.");
  }

  return parseWeatherApiForecast(await response.json(), coordinates);
}
