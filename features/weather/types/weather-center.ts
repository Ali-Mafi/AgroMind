import type {
  AirQualityData,
} from "@/features/weather/types/air-quality";

import type {
  DustCondition,
} from "@/features/weather/types/weather-dust";

import type {
  NormalizedWeatherCondition,
  NormalizedWindDirection,
} from "@/features/weather/types/weather-normalization";

import type {
  WeatherData,
} from "@/features/weather/types/weather";

import type {
  WeatherVisualState,
} from "@/features/weather/types/weather-visual";

export interface WeatherCenterCurrent {
  condition: NormalizedWeatherCondition;

  wind: NormalizedWindDirection;

  dust: DustCondition;

  visualState: WeatherVisualState;
}

export interface WeatherCenterData {
  weather: WeatherData;

  airQuality: AirQualityData | null;

  current: WeatherCenterCurrent;
}