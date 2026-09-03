export type WeatherCondition =
  | "clear"
  | "mainly-clear"
  | "partly-cloudy"
  | "overcast"
  | "fog"
  | "rime-fog"
  | "drizzle"
  | "freezing-drizzle"
  | "rain"
  | "freezing-rain"
  | "snow"
  | "snow-grains"
  | "rain-showers"
  | "snow-showers"
  | "thunderstorm"
  | "thunderstorm-hail"
  | "unknown";

export type WeatherIntensity =
  | "light"
  | "moderate"
  | "heavy";

export interface NormalizedWeatherCondition {
  code: number;

  condition: WeatherCondition;

  label: string;

  intensity?: WeatherIntensity;

  isPrecipitation: boolean;
}

export type WindDirectionCardinal =
  | "N"
  | "NNE"
  | "NE"
  | "ENE"
  | "E"
  | "ESE"
  | "SE"
  | "SSE"
  | "S"
  | "SSW"
  | "SW"
  | "WSW"
  | "W"
  | "WNW"
  | "NW"
  | "NNW";

export interface NormalizedWindDirection {
  degrees: number;

  cardinal: WindDirectionCardinal;

  label: string;
}