"use client";
import { T } from "@/features/settings/components/translated-text";
import { useWeatherFormat } from "../hooks/use-weather-format";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Moon,
  Navigation,
  Sun,
} from "lucide-react";

import {
  normalizeWindDirection,
} from "@/features/weather/lib/normalize-weather";

import type {
  WeatherCondition,
} from "@/features/weather/types/weather-normalization";

import type {
  WeatherData,
} from "@/features/weather/types/weather";

import { buildWeatherTimeline } from "@/features/weather/lib/build-weather-timeline";

interface HourlyForecastProps {
  weather: WeatherData;
  checkedAt: number | null;
}

function WeatherIcon({
  condition,
  isDay,
}: {
  condition: WeatherCondition;
  isDay: boolean;
}) {
  const className =
    "h-8 w-8 sm:h-9 sm:w-9";

  switch (condition) {
    case "clear":
      return isDay ? (
        <Sun className={className} />
      ) : (
        <Moon className={className} />
      );

    case "mainly-clear":
    case "partly-cloudy":
      return isDay ? (
        <CloudSun className={className} />
      ) : (
        <CloudMoon className={className} />
      );

    case "overcast":
      return (
        <Cloud className={className} />
      );

    case "fog":
    case "rime-fog":
    case "dust":
      return (
        <CloudFog className={className} />
      );

    case "drizzle":
    case "freezing-drizzle":
    case "rain":
    case "freezing-rain":
    case "rain-showers":
      return (
        <CloudRain className={className} />
      );

    case "snow":
    case "snow-grains":
    case "snow-showers":
      return (
        <CloudSnow className={className} />
      );

    case "thunderstorm":
    case "thunderstorm-hail":
      return (
        <CloudLightning
          className={className}
        />
      );

    case "unknown":
    default:
      return (
        <CloudSun className={className} />
      );
  }
}

export function HourlyForecast({
  weather,
  checkedAt,
}: HourlyForecastProps) {
  const { weatherClock: formatHour, temperature, measure, t } = useWeatherFormat();
  const asOf = checkedAt ?? Date.parse(weather.current.time);
  const cards = buildWeatherTimeline(weather, asOf);
  const reportIsOld = asOf - Date.parse(weather.current.time) > 30 * 60 * 1000;
  const sourceName = weather.forecastSource === "weatherapi" ? "WeatherAPI" : "Open-Meteo";

  return (
    <div className="relative">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white"><T text="Hourly Forecast" /></h2>
          <p className="mt-1 text-xs text-white/60"><T text="Now + next 24 hours ·" />{" "}{sourceName}</p>
        </div>
        <p className="text-xs text-white/55">{weather.timezoneAbbreviation}</p>
      </div>

      <div className="relative mt-4">
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-12 bg-linear-to-l from-black/20 to-transparent" />
        <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 pr-8 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.25)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
          {cards.map((card) => {
            const isCurrent = card.kind === "current";
            const wind = normalizeWindDirection(card.windDirection);
            const probabilityLabel = card.precipitationProbabilityKind === "rain" ? "Rain"
              : card.precipitationProbabilityKind === "snow" ? "Snow" : "Precip.";

            return (
              <article
                key={card.key}
                data-weather-kind={card.kind}
                className={[
                  "min-w-26 snap-start rounded-2xl border px-3 py-3.5 text-center",
                  isCurrent ? "border-white/25 bg-white/20" : "border-white/10 bg-black/20",
                ].join(" ")}
              >
                <p className="text-xs font-semibold text-white/75">
                  {isCurrent ? (reportIsOld ? "Last report" : "Now") : formatHour(card.time)}
                </p>
                <p className="mt-1 text-[10px] text-white/55">
                  {isCurrent ? (weather.current.source === "weatherapi" ? "Reported" : "Model estimate") : t("Forecast")}
                </p>
                <div className="mt-3 flex justify-center text-white" title={t(card.condition.label)}>
                  <WeatherIcon condition={card.condition.condition} isDay={card.isDay} />
                </div>
                <p className="mt-2.5 text-xl font-bold text-white">{temperature(card.temperature)}</p>
                <p className="mt-0.5 text-[10px] text-white/55">{t("Feels like {value}", { value: temperature(card.feelsLike) })}</p>
                <div className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-sky-200">
                  <Droplets className="h-3 w-3" />
                  <span>
                    {card.precipitationProbability !== null
                      ? `${probabilityLabel} ${Math.round(card.precipitationProbability)}%`
                      : t("Chance —")}
                  </span>
                </div>
                <div className="mt-3 border-t border-white/10 pt-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <Navigation className="h-3 w-3 text-white/60"
                      style={{ transform: `rotate(${card.windDirection}deg)` }} />
                    <span className="text-[11px] font-semibold text-white/80">{wind.cardinal}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/50">{measure(card.windSpeed, "wind", 0)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
