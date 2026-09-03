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

    timezone: "auto",

    forecast_days: "10",
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

    timezone: data.timezone,
    timezoneAbbreviation:
      data.timezone_abbreviation,
    utcOffsetSeconds:
      data.utc_offset_seconds,
    elevation: data.elevation,

    current: {
      time:
        data.current.time,

      intervalSeconds:
        data.current.interval,

      temperature:
        data.current.temperature_2m,

      feelsLike:
        data.current.apparent_temperature,

      humidity:
        data.current.relative_humidity_2m,

      dewPoint:
        data.current.dew_point_2m,

      precipitation:
        data.current.precipitation,

      precipitationProbability:
        data.current.precipitation_probability ??
        null,

      rain:
        data.current.rain,

      showers:
        data.current.showers,

      snowfall:
        data.current.snowfall,

      weatherCode:
        data.current.weather_code,

      isDay:
        data.current.is_day === 1,

      cloudCover:
        data.current.cloud_cover,

      pressureMsl:
        data.current.pressure_msl,

      surfacePressure:
        data.current.surface_pressure,

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
      (time: string, index: number) => ({
        time,

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

        precipitation:
          data.hourly.precipitation[index],

        rain:
          data.hourly.rain[index],

        showers:
          data.hourly.showers[index],

        snowfall:
          data.hourly.snowfall[index],

        weatherCode:
          data.hourly.weather_code[index],

        isDay:
          data.hourly.is_day[index] === 1,

        cloudCover:
          data.hourly.cloud_cover[index],

        visibility:
          data.hourly.visibility[index],

        pressureMsl:
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
      (date: string, index: number) => ({
        date,

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

        precipitationSum:
          data.daily.precipitation_sum[index],

        rainSum:
          data.daily.rain_sum[index],

        showersSum:
          data.daily.showers_sum[index],

        snowfallSum:
          data.daily.snowfall_sum[index],

        weatherCode:
          data.daily.weather_code[index],

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
          data.daily.sunrise[index],

        sunset:
          data.daily.sunset[index],

        uvIndexMax:
          data.daily.uv_index_max[index],
      }),
    ),
  };
}