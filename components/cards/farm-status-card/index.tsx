"use client";
import { T } from "@/features/settings/components/translated-text";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  BrainCircuit,
  CloudSun,
  Droplets,
  MapPin,
  Thermometer,
} from "lucide-react";

import { FarmStatusCardProps } from "./types";

export function FarmStatusCard({
  farmName,
  area,
  crop,
  location,
  moisture,
  temperature,
  humidity,
  weather,
  recommendation,
}: FarmStatusCardProps) {
  const { format } = useSettings();
  const t = useTranslation();
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">

      <div>
        <h3 className="text-xl font-bold">
          {farmName}
        </h3>

        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {t("Sample farm · Not live data")}
        </p>
      </div>

      {area != null && <p className="mt-3 text-sm text-muted-foreground">{crop} · <bdi>{format.measure(area, "area")}</bdi></p>}
      <div className="my-6 h-px bg-border" />

      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-primary" />
            <span><T text="Weather" /></span>
          </div>

          <span className="font-medium">
            {t(weather)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-primary" />
            <span><T text="Temperature" /></span>
          </div>

          <span className="font-medium">
            {format.measure(temperature, "temperature", 0)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <span><T text="Soil Moisture" /></span>
          </div>

          <span className="font-medium">
            {moisture}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <span><T text="Humidity" /></span>
          </div>

          <span className="font-medium">
            {humidity}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span><T text="AI Status" /></span>
          </div>

          <span className="font-semibold text-primary">
            {t(recommendation)}
          </span>
        </div>

      </div>
    </div>
  );
}
