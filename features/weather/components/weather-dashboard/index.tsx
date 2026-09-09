"use client";

import { useTranslation } from "@/features/settings/hooks/use-translation";
import { T } from "@/features/settings/components/translated-text";
import type { FarmLocation } from "@/features/farms/types/farms";
import { useWeather } from "@/features/weather/components/hooks/use-weather";
import { WeatherSourceStatus } from "@/features/weather/components/weather-source-status";
import { useWeatherFormat } from "../hooks/use-weather-format";
import { localWeatherTime } from "@/features/weather/lib/weather-presentation";

interface WeatherDashboardProps {
  coordinates: FarmLocation;
}

export default function WeatherDashboard({
  coordinates,
}: WeatherDashboardProps) {
  const t = useTranslation();
  const { measure, number } = useWeatherFormat();
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
        <h2 className="text-xl font-bold sm:text-2xl"><T text="Weather" /></h2>

        <p className="mt-2 text-sm text-muted-foreground"><T text="Loading weather data..." /></p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
        <h2 className="text-xl font-bold sm:text-2xl"><T text="Weather" /></h2>

        <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            <T text={error} />
          </p>
          <button type="button" onClick={refresh} className="mt-3 rounded-lg border px-3 py-2 text-sm"><T text="Try again" /></button>
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
        <h2 className="text-xl font-bold sm:text-2xl"><T text="Weather" /></h2>

        <p className="mt-1 text-sm text-muted-foreground"><T text="Latest available weather for this farm location." /></p>
      </div>

      <div className="mt-3 text-muted-foreground">
        <WeatherSourceStatus weather={weather} checkedAt={checkedAt}
          isRefreshing={isRefreshing} refreshError={refreshError} onRefresh={refresh} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground"><T text="Temperature" /></p>

          <p className="mt-2 text-2xl font-bold">
            {measure(weather.current.temperature, "temperature", 0)}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground"><T text="Humidity" /></p>

          <p className="mt-2 text-2xl font-bold">
            {number(weather.current.humidity, 0)}%
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground"><T text="Wind" /></p>

          <p className="mt-2 text-2xl font-bold">
            {measure(weather.current.windSpeed, "wind", 0)}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground"><T text="Precipitation" /></p>

          <p className="mt-2 text-2xl font-bold">
            {today?.precipitationSum != null ? measure(today.precipitationSum, "precipitation") : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {today?.precipitationSum != null ? t("Today's total forecast") : t("Daily forecast unavailable")}
          </p>
        </div>
      </div>
    </section>
  );
}
