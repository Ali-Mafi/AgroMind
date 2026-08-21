import type {
  WeatherCoordinates,
  WeatherData,
} from "@/features/weather/types/weather";

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast";

export async function getWeather(
  coordinates: WeatherCoordinates,
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),

    current:
      "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code",

    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",

    timezone: "auto",

    forecast_days: "7",
  });

  const response = await fetch(
    `${OPEN_METEO_URL}?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch weather data.",
    );
  }

  const data = await response.json();

  return {
    coordinates,

    current: {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
    },

    daily: data.daily.time.map(
      (date: string, index: number) => ({
        date,
        temperatureMax:
          data.daily.temperature_2m_max[index],
        temperatureMin:
          data.daily.temperature_2m_min[index],
        precipitationProbability:
          data.daily
            .precipitation_probability_max[index],
        weatherCode:
          data.daily.weather_code[index],
      }),
    ),
  };
}