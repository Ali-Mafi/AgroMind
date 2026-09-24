"use client";
import type { CSSProperties } from "react";
import { CalendarCheck2, Clock3, Droplets, Sprout, Trees, RadioTower, MapPin } from "lucide-react";
import { SummaryCard } from "@/components/ui/workspace";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { parseLocalDate } from "@/features/settings/lib/calendar";
import WeatherDashboard from "@/features/weather/components/weather-dashboard";
import { resolveCropVisual } from "@/features/farms/lib/resolve-farm-visual";
import type { Farm } from "../types/farms";
import type { IrrigationSchedule } from "@/features/irrigation/types/irrigation";

type CropVisualStyle = CSSProperties & {
  "--farm-crop-image": string;
  "--farm-crop-size": string;
  "--farm-crop-position": string;
};

export function FarmOverviewCards({
  farm,
  schedule,
  showSensors = false,
  appearance = "default",
}: {
  farm: Farm;
  schedule?: IrrigationSchedule;
  showSensors?: boolean;
  appearance?: "default" | "dashboard";
}) {
  const t = useTranslation();
  const { format } = useSettings();
  const cropVisual = resolveCropVisual(farm);
  const cropVisualStyle: CropVisualStyle = {
    "--farm-crop-image": `url("${cropVisual.image}")`,
    "--farm-crop-size": cropVisual.backgroundSize,
    "--farm-crop-position": cropVisual.backgroundPosition,
  };
  return (
    <div className="grid auto-rows-fr gap-5 md:grid-cols-2" data-farm-overview={appearance} data-sensors={showSensors}>
      {farm.coordinates ? (
        <WeatherDashboard coordinates={farm.coordinates} farmId={farm.id} appearance={appearance} />
      ) : (
        <SummaryCard
          className="farm-weather-card"
          title={t("Weather")}
          icon={<MapPin size={18} />}
          href={`/farms/${farm.id}/edit`}
          footer={t("Add farm location")}
        >
          <p className="text-lg font-semibold">{t("Add farm location")}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t(
              "Add the exact farm location to enable live weather data for this property.",
            )}
          </p>
        </SummaryCard>
      )}
      <SummaryCard
        className="farm-irrigation-card"
        title={t("Next irrigation")}
        icon={<Droplets size={18} />}
        href={`/irrigation?farm=${encodeURIComponent(farm.id)}`}
        footer={t(schedule ? "Manage irrigation" : "Schedule irrigation")}
      >
        {appearance === "dashboard" && schedule ? (
          <div data-irrigation-event>
            <span data-schedule-label className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <CalendarCheck2 size={14} aria-hidden="true" />{t("Scheduled")}
            </span>
            <p className="mt-3 text-xl font-semibold leading-snug">
              {format.date(parseLocalDate(schedule.date) ?? new Date())}
            </p>
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">{t("Time")}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums"><bdi>{format.clock(schedule.time)}</bdi></dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("Duration")}</dt>
                <dd className="mt-1 inline-flex items-center gap-1.5 text-xl font-semibold tabular-nums">
                  <Clock3 size={15} aria-hidden="true" /><bdi>{format.number(schedule.duration)} <span className="text-sm font-normal text-muted-foreground">{t("min")}</span></bdi>
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <>
            <p className="text-xl font-semibold">
              {schedule
                ? format.date(parseLocalDate(schedule.date) ?? new Date())
                : t("No irrigation scheduled")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {schedule
                ? `${format.clock(schedule.time)} · ${format.number(schedule.duration)} ${t("min")}`
                : t("Set a time that works for your farm.")}
            </p>
          </>
        )}
      </SummaryCard>
      <SummaryCard
        className="farm-crop-card"
        title={t(farm.type === "garden" ? "Plants / Trees" : "Crop")}
        icon={farm.type === "garden" ? <Trees size={18} /> : <Sprout size={18} />}
        href={`/farms/${farm.id}/insights`}
        footer={t("View crop details")}
      >
        <p className="text-xl font-semibold">
          {farm.type === "garden"
            ? t("{count} plants and trees", {
                count: format.number(farm.plants?.length ?? 0),
              })
            : farm.crop?.name || t("Crop not added yet")}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("Your crop information, in one place.")}
        </p>
      </SummaryCard>
      {showSensors && (
        <SummaryCard
          title={t("Soil monitoring")}
          icon={<RadioTower size={18} />}
          href={`/farms/${farm.id}/sensors`}
          footer={t("View sensors")}
        >
          <p className="text-xl font-semibold">{t("No sensors connected")}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("Soil readings will appear when a sensor is connected.")}
          </p>
        </SummaryCard>
      )}
    </div>
  );
}
