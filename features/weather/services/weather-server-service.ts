import "server-only";

import { getOpenMeteoWeather } from "./open-meteo-service";
import { getWeatherApiWeather } from "./weatherapi-service";
import type { WeatherCoordinates, WeatherData } from "../types/weather";

export async function getFarmWeather(coordinates: WeatherCoordinates): Promise<WeatherData> {
  const key = process.env.WEATHERAPI_API_KEY?.trim();
  if (key) {
    try {
      // Current, hourly and daily weather come from the SAME upstream response.
      return await getWeatherApiWeather(coordinates, key);
    } catch {
      // Switch the entire dataset together; never splice another provider's hours.
    }
  }

  try {
    const model = await getOpenMeteoWeather(coordinates);
    return { ...model, currentStatus: key ? "fallback" : "model-only" };
  } catch {
    throw new Error("Weather is unavailable.");
  }
}
