import "server-only";

import { getOpenMeteoWeather } from "./open-meteo-service";
import { getWeatherApiWeather } from "./weatherapi-service";
import type { WeatherCoordinates, WeatherData } from "../types/weather";
import { extendWeatherForecast, needsForecastExtension } from "../lib/extend-weather-forecast";

export async function getFarmWeather(coordinates: WeatherCoordinates): Promise<WeatherData> {
  const key = process.env.WEATHERAPI_API_KEY?.trim();
  let primary: WeatherData | undefined;
  if (key) {
    try {
      primary = await getWeatherApiWeather(coordinates, key);
    } catch {
      // If the primary report fails, fall back with current and forecast together.
    }
  }

  if (primary) {
    const asOf = Date.now();
    if (!needsForecastExtension(primary, asOf)) return extendWeatherForecast(primary, null, asOf, false);
    let extension: WeatherData | null = null;
    try {
      extension = await getOpenMeteoWeather(coordinates, {
        forecastExtension: true, timezone: primary.timezone, asOf,
      });
    } catch {
      // A failed long-range request must not discard a valid current report.
    }
    return extendWeatherForecast(primary, extension, asOf);
  }

  try {
    const model = await getOpenMeteoWeather(coordinates);
    return { ...model, currentStatus: key ? "fallback" : "model-only" };
  } catch {
    throw new Error("Weather is unavailable.");
  }
}
