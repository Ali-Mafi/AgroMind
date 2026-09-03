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
  normalizeWeatherCode,
  normalizeWindDirection,
} from "@/features/weather/lib/normalize-weather";

import type {
  WeatherCondition,
} from "@/features/weather/types/weather-normalization";

import type {
  WeatherData,
} from "@/features/weather/types/weather";

interface HourlyForecastProps {
  weather: WeatherData;
}

function getFarmCurrentHourKey(
  timeZone: string,
) {
  const parts =
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());

  const getPart = (type: string) =>
    parts.find(
      (part) => part.type === type,
    )?.value ?? "";

  return [
    `${getPart("year")}-${getPart(
      "month",
    )}-${getPart("day")}`,
    `${getPart("hour")}:00`,
  ].join("T");
}

function formatHour(
  time: string,
) {
  const hour = Number(
    time.slice(11, 13),
  );

  if (hour === 0) {
    return "12 AM";
  }

  if (hour === 12) {
    return "12 PM";
  }

  if (hour > 12) {
    return `${hour - 12} PM`;
  }

  return `${hour} AM`;
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
}: HourlyForecastProps) {
  const currentHourKey =
    getFarmCurrentHourKey(
      weather.timezone,
    );

  const startIndex =
    weather.hourly.findIndex(
      (hour) =>
        hour.time >= currentHourKey,
    );

  const safeStartIndex =
    startIndex >= 0 ? startIndex : 0;

  const hourlyForecast =
    weather.hourly.slice(
      safeStartIndex,
      safeStartIndex + 24,
    );

  return (
    <div className="relative">
        <div className="flex items-end justify-between gap-4">
        <div>
            <h2 className="text-sm font-semibold text-white">
            Hourly Forecast
            </h2>

            <p className="mt-1 text-xs text-white/60">
            Next 24 hours
            </p>
        </div>

        <p className="text-xs text-white/55">
            {weather.timezoneAbbreviation}
        </p>
        </div>

        <div className="relative mt-4">
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-12 bg-linear-to-l from-black/20 to-transparent" />

        <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 pr-8 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.25)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
            {hourlyForecast.map(
            (hour, index) => {
                const condition =
                normalizeWeatherCode(
                    hour.weatherCode,
                );

                const wind =
                normalizeWindDirection(
                    hour.windDirection,
                );

                const isCurrentHour =
                index === 0 &&
                hour.time ===
                    currentHourKey;

                return (
                <article
                    key={hour.time}
                    className={[
                    "min-w-26 snap-start rounded-2xl border px-3 py-3.5 text-center backdrop-blur-md transition",
                    isCurrentHour
                        ? "border-white/25 bg-white/15"
                        : "border-white/10 bg-black/10",
                    ].join(" ")}
                >
                    <p className="text-xs font-semibold text-white/75">
                    {isCurrentHour
                        ? "Now"
                        : formatHour(
                            hour.time,
                        )}
                    </p>

                    <div className="mt-3 flex justify-center text-white">
                    <WeatherIcon
                        condition={
                        condition.condition
                        }
                        isDay={hour.isDay}
                    />
                    </div>

                    <p className="mt-2.5 text-xl font-bold text-white">
                    {Math.round(
                        hour.temperature,
                    )}
                    °
                    </p>

                    <p className="mt-0.5 text-[10px] text-white/55">
                    Feels{" "}
                    {Math.round(
                        hour.feelsLike,
                    )}
                    °
                    </p>

                    <div className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-sky-200">
                    <Droplets className="h-3 w-3" />

                    {Math.round(
                        hour
                        .precipitationProbability,
                    )}
                    %
                    </div>

                    <div className="mt-3 border-t border-white/10 pt-2.5">
                    <div className="flex items-center justify-center gap-1">
                        <Navigation
                        className="h-3 w-3 text-white/60"
                        style={{
                            transform: `rotate(${hour.windDirection}deg)`,
                        }}
                        />

                        <span className="text-[11px] font-semibold text-white/80">
                        {wind.cardinal}
                        </span>
                    </div>

                    <p className="mt-1 text-[10px] text-white/50">
                        {Math.round(
                        hour.windSpeed,
                        )}{" "}
                        km/h
                    </p>
                    </div>
                </article>
                );
            },
            )}
        </div>
        </div>
    </div>
    );
}