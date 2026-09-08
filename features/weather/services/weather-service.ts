import type {
  WeatherCoordinates,
  WeatherData,
} from "@/features/weather/types/weather";

export async function getWeather(
  coordinates: WeatherCoordinates,
  signal?: AbortSignal,
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
  });

  const response = await fetch(`/api/weather?${params}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Unable to load weather data.");
  }

  return response.json();
}
