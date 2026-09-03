"use client";

import {
  useAirQuality,
} from "@/features/weather/components/hooks/use-air-quality";

import {
  useWeather,
} from "@/features/weather/components/hooks/use-weather";

import {
  normalizeWeatherCode,
  normalizeWindDirection,
} from "@/features/weather/lib/normalize-weather";

import {
  resolveDustCondition,
} from "@/features/weather/lib/resolve-dust-condition";

import {
  resolveWeatherVisualState,
} from "@/features/weather/lib/resolve-weather-visual-state";

import type {
  DustCondition,
} from "@/features/weather/types/weather-dust";

import type {
  WeatherCenterData,
} from "@/features/weather/types/weather-center";

import type {
  WeatherCoordinates,
} from "@/features/weather/types/weather";

const UNAVAILABLE_DUST: DustCondition = {
  status: "unavailable",
  isDusty: false,
  intensity: null,
  dustShare: null,
};

export function useWeatherCenter(
  coordinates?: WeatherCoordinates,
) {
  const {
    weather,
    isLoading: isWeatherLoading,
    error: weatherError,
  } = useWeather(coordinates);

  const {
    airQuality,
    isLoading: isAirQualityLoading,
    error: airQualityError,
  } = useAirQuality(coordinates);

  let data: WeatherCenterData | null = null;

  if (weather) {
    const condition =
      normalizeWeatherCode(
        weather.current.weatherCode,
      );

    const wind =
      normalizeWindDirection(
        weather.current.windDirection,
      );

    const dust =
      airQuality
        ? resolveDustCondition(
            airQuality.current,
          )
        : UNAVAILABLE_DUST;

    const visualState =
        resolveWeatherVisualState({
            condition: condition.condition,
            intensity: condition.intensity,
            isDay: weather.current.isDay,
        });

    data = {
      weather,
      airQuality,

      current: {
        condition,
        wind,
        dust,
        visualState,
      },
    };
  }

  return {
    data,

    isWeatherLoading,
    isAirQualityLoading,

    weatherError,
    airQualityError,
  };
}