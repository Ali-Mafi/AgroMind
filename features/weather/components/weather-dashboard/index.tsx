"use client";
import Link from "next/link";
import { Wind, Droplets } from "lucide-react";
import { Disclosure } from "@/components/ui/disclosure";
import { NavigationArrow } from "@/components/ui/navigation-arrow";
import type { FarmLocation } from "@/features/farms/types/farms";
import { useWeather } from "@/features/weather/components/hooks/use-weather";
import { useWeatherFormat } from "../hooks/use-weather-format";
import { WeatherSourceStatus } from "../weather-source-status";
import { WeatherIcon } from "../weather-icon";
import { localWeatherTime } from "@/features/weather/lib/weather-presentation";
import { Button } from "@/components/ui/button";
import styles from "./weather-dashboard.module.css";

export default function WeatherDashboard({ coordinates, farmId, returnTo = "/dashboard", appearance = "default" }: {
  coordinates: FarmLocation;
  farmId?: string;
  returnTo?: "/dashboard" | "/irrigation";
  appearance?: "default" | "dashboard";
}) {
  const { t, measure, weatherClock } = useWeatherFormat();
  const { weather, isLoading, error, isRefreshing, refreshError, checkedAt, refresh } = useWeather(coordinates);
  const cardClass = `app-card overflow-hidden ${appearance === "dashboard" ? styles.weather : ""}`;
  if (isLoading) return (
    <section className={`${cardClass} p-6`} aria-busy="true">
      <h3 className="text-sm font-medium text-muted-foreground">{t("Weather")}</h3>
      <p role="status" className="mt-5 text-sm">{t("Loading weather data...")}</p>
      <div aria-hidden="true" className="mt-4 h-12 w-32 rounded-xl bg-muted motion-safe:animate-pulse" />
    </section>
  );
  if (error || !weather) return (
    <section className={`${cardClass} p-6`}>
      <h3 className="text-sm font-medium">{t("Weather")}</h3>
      <p className="mt-4 text-sm text-muted-foreground" role="status">{t(error || "Weather data is unavailable.")}</p>
      <Button variant="outline" onClick={refresh} className="mt-4 min-h-11">{t("Try again")}</Button>
    </section>
  );
  const todayKey = localWeatherTime(weather.timezone, checkedAt ?? Date.parse(weather.current.time)).slice(0, 10);
  const today = weather.daily.find(day => day.date === todayKey);
  const content = (
    <div className={styles.conditions}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{t("Weather")}</h3>
        {appearance === "dashboard" && (
          <span className={styles.reportTime}>
            {t(weather.current.source === "open-meteo" ? "Valid time" : "Report time")}
            <time dateTime={weather.current.time}>
              <bdi>{weatherClock(localWeatherTime(weather.timezone, Date.parse(weather.current.time)))}</bdi>
            </time>
          </span>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`${styles.temperature} text-4xl font-semibold tracking-tight sm:text-5xl`}><bdi>{measure(weather.current.temperature, "temperature", 0)}</bdi></p>
          <p className="mt-2 text-sm">{t(weather.current.condition.label)}</p>
        </div>
        <div className={styles.icon}>
          <WeatherIcon condition={weather.current.condition.condition} isDay={weather.current.isDay} className="size-14 text-[var(--app-gold)]" />
        </div>
      </div>
      <div className={`${styles.metrics} mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground`}>
        <span className="inline-flex items-center gap-2"><Wind size={16} aria-hidden="true" /><span className="sr-only">{t("Wind")}</span><bdi>{measure(weather.current.windSpeed, "wind", 0)}</bdi></span>
        <span className="inline-flex items-center gap-2"><Droplets size={16} aria-hidden="true" /><span className="sr-only">{t("Today's total forecast")}</span><bdi>{today?.precipitationSum != null ? measure(today.precipitationSum, "precipitation") : t("Daily forecast unavailable")}</bdi></span>
      </div>
    </div>
  );
  return (
    <section className={cardClass} data-condition={weather.current.condition.condition} data-day={weather.current.isDay} data-precipitation={weather.current.condition.isPrecipitation}>
      {farmId ? (
        <Link href={`/weather?farm=${encodeURIComponent(farmId)}&from=${returnTo.slice(1)}`} aria-label={t("Open local forecast")} className={`${styles.forecastLink} app-card-link block p-5 transition-colors hover:bg-muted/30 sm:p-6`}>
          {content}
          <span className={`${styles.forecastFooter} mt-5 flex items-center justify-between border-t pt-4 text-sm font-medium text-primary`}>{t("View forecast")}<NavigationArrow size={16} /></span>
        </Link>
      ) : <div className="p-6">{content}</div>}
      {weather.currentStatus === "fallback" && <p role="status" className="px-5 pb-3 text-xs leading-5 text-muted-foreground sm:px-6">{t("WeatherAPI unavailable. Current conditions and forecasts now use Open-Meteo.")}</p>}
      {refreshError && <p role="status" className="px-5 pb-3 text-xs leading-5 text-muted-foreground sm:px-6">{t(refreshError)}</p>}
      <Disclosure className="border-t px-5 text-xs text-muted-foreground sm:px-6" title={t("Forecast details & refresh")}>
        <WeatherSourceStatus weather={weather} checkedAt={checkedAt} isRefreshing={isRefreshing} refreshError={refreshError} onRefresh={refresh} />
      </Disclosure>
    </section>
  );
}
