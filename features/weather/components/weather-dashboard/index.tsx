"use client";

import type { FarmLocation } from "@/features/farms/types/farms";
import { useWeather } from "@/features/weather/components/hooks/use-weather";
import { WeatherSourceStatus } from "@/features/weather/components/weather-source-status";
import { localWeatherTime, rainAmount } from "@/features/weather/lib/weather-presentation";

interface WeatherDashboardProps {
  coordinates: FarmLocation;
}

export default function WeatherDashboard({
  coordinates,
}: WeatherDashboardProps) {
  const {
    weather,
    isLoading,
    error,
    isRefreshing,
    refreshError,
    checkedAt,
    refresh,
  } = useWeather(coordinates);

  if (isLoading) {
    return (
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
        <h2 className="text-xl font-bold sm:text-2xl">
          Weather
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Loading weather data...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
        <h2 className="text-xl font-bold sm:text-2xl">
          Weather
        </h2>

        <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            {error}
          </p>
          <button type="button" onClick={refresh} className="mt-3 rounded-lg border px-3 py-2 text-sm">
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!weather) {
    return null;
  }

  const todayKey = localWeatherTime(weather.timezone, checkedAt ?? Date.parse(weather.current.time)).slice(0, 10);
  const today = weather.daily.find((day) => day.date === todayKey);

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">
          Weather
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Latest available weather for this farm location.
        </p>
      </div>

      <div className="mt-3 text-muted-foreground">
        <WeatherSourceStatus weather={weather} checkedAt={checkedAt}
          isRefreshing={isRefreshing} refreshError={refreshError} onRefresh={refresh} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">
            Temperature
          </p>

          <p className="mt-2 text-2xl font-bold">
            {weather.current.temperature}°C
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">
            Humidity
          </p>

          <p className="mt-2 text-2xl font-bold">
            {weather.current.humidity}%
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">
            Wind
          </p>

          <p className="mt-2 text-2xl font-bold">
            {weather.current.windSpeed} km/h
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">
            Precipitation
          </p>

          <p className="mt-2 text-2xl font-bold">
            {today?.precipitationSum != null ? `${rainAmount(today.precipitationSum)} mm` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {today?.precipitationSum != null ? "Today's total forecast" : "Daily forecast unavailable"}
          </p>
        </div>
      </div>
    </section>
  );
}
