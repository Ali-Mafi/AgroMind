import type { NormalizedWeatherCondition } from "./weather-normalization";

export type WeatherSource = "open-meteo" | "weatherapi";

export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  source: WeatherSource;
  /** UTC ISO time supplied by the provider, never the browser's fetch time. */
  time: string;
  /** Backward accumulation period for precipitation; null when undocumented. */
  intervalSeconds: number | null;

  temperature: number;
  feelsLike: number;

  humidity: number;
  dewPoint: number | null;

  precipitation: number | null;
  precipitationProbability: number | null;

  rain: number | null;
  showers: number | null;
  snowfall: number | null;

  /** Already normalized by this provider's adapter; code remains provider-native. */
  condition: NormalizedWeatherCondition;

  isDay: boolean;

  cloudCover: number;

  pressure: number;
  surfacePressure: number | null;

  visibility: number;

  windSpeed: number;
  windDirection: number;
  windGusts: number;
}

export interface HourlyWeather {
  source?: WeatherSource;
  /** Local forecast time in the provider's timezone. */
  time: string;
  /** Native Unix seconds, when the provider supplies an absolute timestamp. */
  timeEpoch?: number;

  temperature: number;
  feelsLike: number;

  humidity: number;
  dewPoint: number | null;

  precipitationProbability: number | null;
  precipitationProbabilityKind: "precipitation" | "rain" | "snow";
  precipitation: number | null;

  rain: number | null;
  showers: number | null;
  snowfall: number | null;

  condition: NormalizedWeatherCondition;

  isDay: boolean;

  cloudCover: number;

  visibility: number;
  pressure: number;

  windSpeed: number;
  windDirection: number;
  windGusts: number;
}

export interface DailyWeather {
  source?: WeatherSource;
  date: string;

  temperatureMax: number;
  temperatureMin: number;

  feelsLikeMax: number | null;
  feelsLikeMin: number | null;

  precipitationProbability: number | null;
  precipitationProbabilityKind: "precipitation" | "rain" | "snow";
  precipitationSum: number;

  rainSum: number | null;
  showersSum: number | null;
  snowfallSum: number | null;

  condition: NormalizedWeatherCondition;

  windSpeedMax: number;
  windGustsMax: number | null;
  windDirectionDominant: number | null;

  sunrise: string | null;
  sunset: string | null;

  uvIndexMax: number | null;
}

export interface WeatherData {
  coordinates: WeatherCoordinates;
  currentStatus: "primary" | "model-only" | "fallback";
  /** Primary provider. Individual forecast days/hours carry their own source. */
  forecastSource: WeatherSource;
  forecastStatus: "available" | "unavailable";
  forecastExtensionStatus?: "available" | "unavailable";

  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number | null;

  elevation: number | null;

  current: CurrentWeather;

  hourly: HourlyWeather[];

  daily: DailyWeather[];
}
