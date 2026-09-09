"use client";
import { T } from "@/features/settings/components/translated-text";
import { useWeatherFormat } from "../hooks/use-weather-format";
import {
  Droplets,
  Gauge,
  Navigation,
  Umbrella,
} from "lucide-react";

import {
  WeatherBackground,
} from "@/features/weather/components/weather-background";

import type {
  WeatherCenterData,
} from "@/features/weather/types/weather-center";

import {
  HourlyForecast,
} from "@/features/weather/components/hourly-forecast";
import { WeatherSourceStatus } from "@/features/weather/components/weather-source-status";

interface CurrentWeatherHeroProps {
  data: WeatherCenterData;

  farmName: string;
  checkedAt: number | null;
  isRefreshing: boolean;
  refreshError: string | null;
  onRefresh: () => void;
}

function formatIntervalMinutes(
  intervalSeconds: number,
) {
  return Math.max(
    1,
    Math.round(intervalSeconds / 60),
  );
}

export function CurrentWeatherHero({
  data,
  farmName,
  checkedAt,
  isRefreshing,
  refreshError,
  onRefresh,
}: CurrentWeatherHeroProps) {
  const { temperature: formatTemperature, measure, reading, symbol, t } = useWeatherFormat();
  const {
    weather,
    current,
  } = data;

  const dateParts = new Intl.DateTimeFormat("en", {
    timeZone: weather.timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(checkedAt ?? weather.current.time));
  const part = (type: string) => dateParts.find((p) => p.type === type)?.value;
  const todayKey = `${part("year")}-${part("month")}-${part("day")}`;
  const today = weather.daily.find((day) => day.date === todayKey) ?? null;

  const precipitationProbability =
    today?.precipitationProbability ?? null;

  const todayCondition = today?.condition ?? null;
  const forecastSourceName = weather.forecastSource === "weatherapi" ? "WeatherAPI" : "Open-Meteo";
  const probabilityLabel = today?.precipitationProbabilityKind === "rain" ? "rain chance"
    : today?.precipitationProbabilityKind === "snow" ? "snow chance" : "max chance";

  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 shadow-xl">
      <WeatherBackground
        visualState={current.visualState}
      />

      <div className="absolute inset-0 bg-linear-to-b from-black/5 via-black/10 to-black/45" />

      <div className="relative z-10 flex flex-col p-5 text-white sm:p-7 lg:p-9">
        <div>
          <p className="text-sm font-medium text-white/80">
            {farmName}
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <p className="text-[4.75rem] font-light leading-none tracking-[-0.07em] sm:text-[6.5rem]">
              {formatTemperature(
                weather.current.temperature,
              )}
            </p>

            <p className="text-lg font-medium sm:text-xl">
              {t(current.condition.label)}
            </p>

            {todayCondition && (
                <p className="text-sm font-medium text-white/75 sm:text-base"><T text="Today's forecast:" />{" "}{t(todayCondition.label)} · {forecastSourceName}
                </p>
              )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80 sm:text-base">
              <span><T text="Feels like" />{" "}
                {formatTemperature(
                  weather.current.feelsLike,
                )}
              </span>

              {today && (
                <>
                  <span
                    aria-hidden="true"
                    className="text-white/40"
                  >
                    •
                  </span>

                  <span>
                    H:
                    {formatTemperature(
                      today.temperatureMax,
                    )}
                  </span>

                  <span>
                    L:
                    {formatTemperature(
                      today.temperatureMin,
                    )}
                  </span>
                </>
              )}
            </div>
            <div className="mt-2 text-white/75">
              <WeatherSourceStatus
                weather={weather} checkedAt={checkedAt}
                isRefreshing={isRefreshing} refreshError={refreshError}
                onRefresh={onRefresh}
              />
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          {weather.forecastStatus === "available" ? (
            <HourlyForecast weather={weather} checkedAt={checkedAt} />
          ) : (
            <p className="text-sm text-white/75">{forecastSourceName}{" "}<T text="forecast is temporarily unavailable." /></p>
          )}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-white/70">
              <Droplets className="h-4 w-4" />

              <span className="text-xs font-medium uppercase tracking-wide"><T text="Humidity" /></span>
            </div>

            <p className="mt-2 text-xl font-semibold">
              {Math.round(
                weather.current.humidity,
              )}
              %
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-white/70">
              <Navigation
                className="h-4 w-4"
                style={{
                  transform: `rotate(${weather.current.windDirection}deg)`,
                }}
              />

              <span className="text-xs font-medium uppercase tracking-wide"><T text="Wind" /></span>
            </div>

            <p className="mt-2 text-xl font-semibold">
              {current.wind.cardinal}{" "}
              {reading(weather.current.windSpeed, "wind")}
            </p>

            <p className="mt-0.5 text-xs text-white/65">
              {symbol("wind")} · {t("Gusts")} {measure(weather.current.windGusts, "wind", 0)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-white/70">
              <Umbrella className="h-4 w-4" />

              <span className="text-xs font-medium uppercase tracking-wide"><T text="Precipitation" /></span>
            </div>

            <p className="mt-2 text-xl font-semibold">
              {today ? measure(today.precipitationSum, "precipitation") : "—"}
            </p>

            <p className="mt-0.5 text-xs text-white/65">
              {today
                ? t("Today's total forecast")
                : t("Daily forecast unavailable")}
            </p>

            <p className="mt-1 text-[10px] leading-4 text-white/50">
              {precipitationProbability !== null
                ? `${Math.round(
                    precipitationProbability,
                  )}% ${probabilityLabel}`
                : t("Chance unavailable")}
            </p>

            {today && <p className="mt-1 text-[10px] text-white/60">{forecastSourceName}</p>}

            {weather.current.intervalSeconds !== null && weather.current.precipitation !== null && (
              <p className="mt-1 text-[10px] leading-4 text-white/45"><T text="Model estimate ·" />{" "}
                {measure(weather.current.precipitation, "precipitation")} · {t("previous")}{" "}
                {formatIntervalMinutes(
                  weather.current.intervalSeconds,
                )}{" "}<T text="min" /></p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-white/70">
              <Gauge className="h-4 w-4" />

              <span className="text-xs font-medium uppercase tracking-wide"><T text="Pressure" /></span>
            </div>

            <p className="mt-2 text-xl font-semibold">
              {reading(weather.current.pressure, "pressure")}
            </p>

            <p className="mt-0.5 text-xs text-white/65">{symbol("pressure")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
