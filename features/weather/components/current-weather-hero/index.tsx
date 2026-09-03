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

interface CurrentWeatherHeroProps {
  data: WeatherCenterData;

  farmName: string;
}

function formatTemperature(
  temperature: number,
) {
  return `${Math.round(temperature)}°`;
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
}: CurrentWeatherHeroProps) {
  const {
    weather,
    current,
  } = data;

  const today =
    weather.daily[0] ?? null;

  const precipitationProbability =
    weather.current
      .precipitationProbability;

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
              {current.condition.label}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80 sm:text-base">
              <span>
                Feels like{" "}
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
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
            <HourlyForecast
                weather={weather}
            />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/15 p-3.5 backdrop-blur-md sm:p-4">
            <div className="flex items-center gap-2 text-white/70">
              <Droplets className="h-4 w-4" />

              <span className="text-xs font-medium uppercase tracking-wide">
                Humidity
              </span>
            </div>

            <p className="mt-2 text-xl font-semibold">
              {Math.round(
                weather.current.humidity,
              )}
              %
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/15 p-3.5 backdrop-blur-md sm:p-4">
            <div className="flex items-center gap-2 text-white/70">
              <Navigation
                className="h-4 w-4"
                style={{
                  transform: `rotate(${weather.current.windDirection}deg)`,
                }}
              />

              <span className="text-xs font-medium uppercase tracking-wide">
                Wind
              </span>
            </div>

            <p className="mt-2 text-xl font-semibold">
              {current.wind.cardinal}{" "}
              {Math.round(
                weather.current.windSpeed,
              )}
            </p>

            <p className="mt-0.5 text-xs text-white/65">
              km/h · Gusts{" "}
              {Math.round(
                weather.current.windGusts,
              )}{" "}
              km/h
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/15 p-3.5 backdrop-blur-md sm:p-4">
            <div className="flex items-center gap-2 text-white/70">
                <Umbrella className="h-4 w-4" />

                <span className="text-xs font-medium uppercase tracking-wide">
                Precipitation
                </span>
            </div>

            <p className="mt-2 text-xl font-semibold">
                {weather.current.precipitation.toFixed(
                1,
                )}{" "}
                mm
            </p>

            <p className="mt-0.5 text-xs text-white/65">
                {precipitationProbability !== null
                ? `${Math.round(
                    precipitationProbability,
                    )}% chance`
                : "Chance unavailable"}
            </p>

            <p className="mt-1 text-[10px] leading-4 text-white/45">
                Model estimate · previous{" "}
                {formatIntervalMinutes(
                weather.current.intervalSeconds,
                )}{" "}
                min
            </p>
            </div>

          <div className="rounded-2xl border border-white/10 bg-black/15 p-3.5 backdrop-blur-md sm:p-4">
            <div className="flex items-center gap-2 text-white/70">
              <Gauge className="h-4 w-4" />

              <span className="text-xs font-medium uppercase tracking-wide">
                Pressure
              </span>
            </div>

            <p className="mt-2 text-xl font-semibold">
              {Math.round(
                weather.current.pressureMsl,
              )}
            </p>

            <p className="mt-0.5 text-xs text-white/65">
              hPa
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}