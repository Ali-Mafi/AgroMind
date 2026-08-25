"use client";

import type { FarmLocation } from "@/features/farms/types/farms";
import { useWeather } from "@/features/weather/components/hooks/use-weather";

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
            Unable to load weather data.
          </p>
        </div>
      </section>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">
          Weather
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Current weather for this farm location.
        </p>
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
            Rain
          </p>

          <p className="mt-2 text-2xl font-bold">
            {weather.current.precipitation} mm
          </p>
        </div>
      </div>
    </section>
  );
}