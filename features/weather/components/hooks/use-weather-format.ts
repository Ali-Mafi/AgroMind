"use client";
import { useMemo } from "react";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { displayMetric, metricUnit } from "@/features/weather/lib/weather-display-units";
import { chanceLabel as baseChanceLabel, WEATHER_METRICS } from "@/features/weather/lib/weather-presentation";
import type { HourlyWeather } from "@/features/weather/types/weather";
import type { WeatherMetric } from "@/features/weather/types/weather-detail";

export function useWeatherFormat() {
  const settings = useSettings();
  const t = useTranslation();
  const { format, units } = settings;
  return useMemo(() => ({
    ...format, t, units,
    weatherClock: format.clock, temperature: format.temperature, rainAmount: format.rain,
    unit: (metric: WeatherMetric) => metricUnit(metric, units),
    metricDescription: (metric: WeatherMetric) => metric === "overnight"
      ? t("Forecast air temperature with a {value} reference. Ground frost can occur at a different air temperature; sensitivity depends on the crop and its growth stage.", { value: format.measure(0, "temperature", 0) })
      : t(WEATHER_METRICS[metric].description),
    reading: (value: number | null, metric: WeatherMetric) => value === null ? "—"
      : metric === "precipitation" ? format.rain(value)
      : format.number(displayMetric(value, metric, units), metric === "pressure" && units.pressure === "inhg" ? 2 : 0),
    weatherDayLabel: (date: string, today?: string, long = false) => date === today ? t("Today")
      : format.date(new Date(`${date}T12:00:00Z`), { timeZone: "UTC", year: undefined, month: long ? "short" : undefined, day: long ? "numeric" : undefined, weekday: long ? "long" : "short" }),
    shortDate: (date: string) => format.date(new Date(`${date}T12:00:00Z`), { timeZone: "UTC", year: undefined, month: "short", day: "numeric" }),
    durationLabel: (minutes: number | null) => minutes === null ? "—" : t("{hours}h {minutes}m", { hours: format.number(Math.floor(minutes / 60), 0), minutes: format.number(minutes % 60, 0) }),
    chanceLabel: (kind: HourlyWeather["precipitationProbabilityKind"]) => t(baseChanceLabel(kind)),
    fieldOutlook: (hours: HourlyWeather[]) => {
      if (!hours.length) return t("Hourly forecast is unavailable.");
      const wet = hours.find((hour) => hour.precipitation !== null && hour.precipitation > 0);
      const wind = format.measure(Math.max(...hours.map((hour) => hour.windGusts)), "wind", 0);
      if (wet) return t("Rain is forecast around {time}. Peak gusts reach {wind}.", { time: format.clock(wet.time), wind });
      return t(hours.every((hour) => hour.precipitation !== null) ? "No rain in the available hourly forecast. Peak gusts reach {wind}." : "Some hourly rainfall amounts are unavailable. Peak gusts reach {wind}.", { wind });
    },
  }), [format, units, t]);
}
