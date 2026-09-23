"use client";
import { Droplets, Sprout, RadioTower, MapPin } from "lucide-react";
import { SummaryCard } from "@/components/ui/workspace";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { parseLocalDate } from "@/features/settings/lib/calendar";
import WeatherDashboard from "@/features/weather/components/weather-dashboard";
import type { Farm } from "../types/farms";
import type { IrrigationSchedule } from "@/features/irrigation/types/irrigation";

export function FarmOverviewCards({
  farm,
  schedule,
  showSensors = false,
}: {
  farm: Farm;
  schedule?: IrrigationSchedule;
  showSensors?: boolean;
}) {
  const t = useTranslation();
  const { format } = useSettings();
  return (
    <div className="grid auto-rows-fr gap-5 md:grid-cols-2">
      {farm.coordinates ? (
        <WeatherDashboard coordinates={farm.coordinates} farmId={farm.id} />
      ) : (
        <SummaryCard
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
        title={t("Next irrigation")}
        icon={<Droplets size={18} />}
        href={`/irrigation?farm=${encodeURIComponent(farm.id)}`}
        footer={t(schedule ? "Manage irrigation" : "Schedule irrigation")}
      >
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
      </SummaryCard>
      <SummaryCard
        title={t(farm.type === "garden" ? "Plants / Trees" : "Crop")}
        icon={<Sprout size={18} />}
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
