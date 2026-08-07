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
  location,
  moisture,
  temperature,
  humidity,
  weather,
  recommendation,
}: FarmStatusCardProps) {
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
          Last sync • 2 min ago
        </p>
      </div>

      <div className="my-6 h-px bg-border" />

      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-primary" />
            <span>Weather</span>
          </div>

          <span className="font-medium">
            {weather}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-primary" />
            <span>Temperature</span>
          </div>

          <span className="font-medium">
            {temperature}°C
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <span>Soil Moisture</span>
          </div>

          <span className="font-medium">
            {moisture}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <span>Humidity</span>
          </div>

          <span className="font-medium">
            {humidity}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span>AI Status</span>
          </div>

          <span className="font-semibold text-primary">
            {recommendation}
          </span>
        </div>

      </div>
    </div>
  );
}