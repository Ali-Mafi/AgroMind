import "server-only";

import { normalizeWeatherCode } from "@/features/weather/lib/normalize-weather";
import { forecastDateWindow } from "@/features/weather/lib/extend-weather-forecast";
import type {
  WeatherCoordinates,
  WeatherData,
} from "@/features/weather/types/weather";

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast";

export async function getOpenMeteoWeather(
  coordinates: WeatherCoordinates,
  options: { forecastExtension?: boolean; timezone?: string; asOf?: number } = {},
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "dew_point_2m",
      "precipitation",
      "precipitation_probability",
      "rain",
      "showers",
      "snowfall",
      "weather_code",
      "is_day",
      "cloud_cover",
      "pressure_msl",
      "surface_pressure",
      "visibility",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
    ].join(","),

    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "dew_point_2m",
      "precipitation_probability",
      "precipitation",
      "rain",
      "showers",
      "snowfall",
      "weather_code",
      "is_day",
      "cloud_cover",
      "visibility",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
    ].join(","),

    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "rain_sum",
      "showers_sum",
      "snowfall_sum",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
      "wind_direction_10m_dominant",
      "sunrise",
      "sunset",
      "uv_index_max",
    ].join(","),

    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",

    timezone: options.timezone ?? "auto",
    timeformat: "unixtime",

    forecast_days: "10",
  });
  if (options.forecastExtension && options.timezone) {
    const dates = forecastDateWindow(options.timezone, options.asOf ?? Date.now());
    // Changing the local date changes the cache key immediately at midnight.
    params.delete("forecast_days");
    params.set("start_date", dates[0]);
    params.set("end_date", dates[9]);
  }

  const response = await fetch(
    `${OPEN_METEO_URL}?${params.toString()}`,
    options.forecastExtension
      ? { cache: "force-cache", next: { revalidate: 1800 }, signal: AbortSignal.timeout(4000) }
      : { cache: "no-store", signal: AbortSignal.timeout(10000) },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch weather data.",
    );
  }

  const data = await response.json();

  if (
    !data.current ||
    !(typeof data.current.time === "string" || Number.isFinite(data.current.time)) ||
    !Number.isFinite(data.utc_offset_seconds) ||
    ![
      data.current.temperature_2m,
      data.current.apparent_temperature,
      data.current.relative_humidity_2m,
      data.current.weather_code,
      data.current.pressure_msl,
      data.current.wind_speed_10m,
      data.current.wind_direction_10m,
      data.current.wind_gusts_10m,
    ].every(Number.isFinite) ||
    !Array.isArray(data.hourly?.time) ||
    !Array.isArray(data.daily?.time)
  ) {
    throw new Error("Invalid Open-Meteo response.");
  }

  // Unix timestamps remain UTC even with a local timezone. Format each instant
  // in that zone so DST changes and half-hour offsets agree with WeatherAPI.
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: data.timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const localTime = (value: number | string): string => {
    if (typeof value === "string") return value;
    const parts = formatter.formatToParts(value * 1000);
    const part = (name: string) => parts.find((entry) => entry.type === name)?.value;
    return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
  };
  // Keep compatibility with older ISO responses while requesting Unix in production.
  const epoch = (value: number | string) => typeof value === "number" ? value
    : Date.parse(`${value}Z`) / 1000 - data.utc_offset_seconds;
  const currentTime = new Date(epoch(data.current.time) * 1000).toISOString();

  return {
    coordinates,
    currentStatus: "model-only",
    forecastSource: "open-meteo",
    forecastStatus: "available",

    timezone: data.timezone,
    timezoneAbbreviation:
      data.timezone_abbreviation,
    utcOffsetSeconds:
      data.utc_offset_seconds,
    elevation: data.elevation,

    current: {
      source: "open-meteo",
      time: currentTime,

      intervalSeconds:
        data.current.interval > 0 ? data.current.interval : null,

      temperature:
        data.current.temperature_2m,

      feelsLike:
        data.current.apparent_temperature,

      humidity:
        data.current.relative_humidity_2m,

      dewPoint:
        data.current.dew_point_2m ?? null,

      precipitation:
        data.current.precipitation ?? null,

      precipitationProbability:
        data.current.precipitation_probability ??
        null,

      rain:
        data.current.rain ?? null,

      showers:
        data.current.showers ?? null,

      snowfall:
        data.current.snowfall ?? null,

      condition: normalizeWeatherCode(data.current.weather_code),

      isDay:
        data.current.is_day === 1,

      cloudCover:
        data.current.cloud_cover,

      pressure:
        data.current.pressure_msl,

      surfacePressure:
        data.current.surface_pressure ?? null,

      visibility:
        data.current.visibility,

      windSpeed:
        data.current.wind_speed_10m,

      windDirection:
        data.current.wind_direction_10m,

      windGusts:
        data.current.wind_gusts_10m,
    },

    hourly: data.hourly.time.map(
      (time: number | string, index: number) => ({
        time: localTime(time),
        timeEpoch: epoch(time),
        source: "open-meteo" as const,

        temperature:
          data.hourly.temperature_2m[index],

        feelsLike:
          data.hourly
            .apparent_temperature[index],

        humidity:
          data.hourly
            .relative_humidity_2m[index],

        dewPoint:
          data.hourly.dew_point_2m[index],

        precipitationProbability:
          data.hourly
            .precipitation_probability[index],
        precipitationProbabilityKind: "precipitation" as const,

        precipitation:
          data.hourly.precipitation[index],

        rain:
          data.hourly.rain[index],

        showers:
          data.hourly.showers[index],

        snowfall:
          data.hourly.snowfall[index],

        condition: normalizeWeatherCode(data.hourly.weather_code[index]),

        isDay:
          data.hourly.is_day[index] === 1,

        cloudCover:
          data.hourly.cloud_cover[index],

        visibility:
          data.hourly.visibility[index],

        pressure:
          data.hourly.pressure_msl[index],

        windSpeed:
          data.hourly.wind_speed_10m[index],

        windDirection:
          data.hourly
            .wind_direction_10m[index],

        windGusts:
          data.hourly.wind_gusts_10m[index],
      }),
    ),

    daily: data.daily.time.map(
      (date: number | string, index: number) => ({
        date: localTime(date).slice(0, 10),
        source: "open-meteo" as const,

        temperatureMax:
          data.daily.temperature_2m_max[index],

        temperatureMin:
          data.daily.temperature_2m_min[index],

        feelsLikeMax:
          data.daily
            .apparent_temperature_max[index],

        feelsLikeMin:
          data.daily
            .apparent_temperature_min[index],

        precipitationProbability:
          data.daily
            .precipitation_probability_max[
              index
            ],
        precipitationProbabilityKind: "precipitation" as const,

        precipitationSum:
          data.daily.precipitation_sum[index],

        rainSum:
          data.daily.rain_sum[index],

        showersSum:
          data.daily.showers_sum[index],

        snowfallSum:
          data.daily.snowfall_sum[index],

        condition: normalizeWeatherCode(data.daily.weather_code[index]),

        windSpeedMax:
          data.daily.wind_speed_10m_max[index],

        windGustsMax:
          data.daily.wind_gusts_10m_max[index],

        windDirectionDominant:
          data.daily
            .wind_direction_10m_dominant[
              index
            ],

        sunrise:
          data.daily.sunrise?.[index] ? localTime(data.daily.sunrise[index]) : null,

        sunset:
          data.daily.sunset?.[index] ? localTime(data.daily.sunset[index]) : null,

        uvIndexMax:
          data.daily.uv_index_max[index],
      }),
    ),
  };
}
