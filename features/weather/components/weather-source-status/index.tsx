"use client";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { T } from "@/features/settings/components/translated-text";
import { useSettings } from "@/features/settings/context/settings-context";
import type { WeatherData } from "@/features/weather/types/weather";

interface WeatherSourceStatusProps {
  weather: WeatherData;
  checkedAt: number | null;
  isRefreshing: boolean;
  refreshError: string | null;
  onRefresh: () => void;
}

export function WeatherSourceStatus({
  weather, checkedAt, isRefreshing, refreshError, onRefresh,
}: WeatherSourceStatusProps) {
  const { format } = useSettings();
  const t = useTranslation();
  const isModel = weather.current.source === "open-meteo";
  const dataTime = new Date(weather.current.time);
  const oldReport = checkedAt !== null && checkedAt - dataTime.getTime() > 30 * 60 * 1000;
  const time = format.date(dataTime, {
    timeZone: weather.timezone,
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="space-y-1 text-xs leading-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p>
          <a
            className="underline decoration-current/40 underline-offset-2"
            href={isModel ? "https://open-meteo.com/" : "https://www.weatherapi.com/"}
            target="_blank" rel="noreferrer"
          >
            {isModel ? t("Open-Meteo · Model estimate") : "WeatherAPI"}
          </a>
          {" · "}{isModel ? t("Valid time") : t("Report time")}{" "}
          <time dateTime={weather.current.time}>{time}</time>
        </p>
        <button
          type="button" onClick={onRefresh} disabled={isRefreshing}
          className="min-h-8 rounded-lg border border-current/25 px-2.5 disabled:opacity-50"
        >
          {isRefreshing ? t("Checking…") : t("Refresh")}
        </button>
      </div>
      <p><T text="Checks every 5 minutes while this page is visible." /></p>
      {weather.currentStatus === "fallback" && (
        <p role="status"><T text="WeatherAPI unavailable. Current conditions and forecasts now use Open-Meteo." /></p>
      )}
      {oldReport && <p role="status"><T text="This report is over 30 minutes old." /></p>}
      {refreshError && <p role="status"><T text={refreshError} /></p>}
    </div>
  );
}
