import {
  Droplets,
  Gauge,
  RadioTower,
} from "lucide-react";

import type { IrrigationSensor } from "@/features/irrigation/types/irrigation";


const SENSOR_ICONS = {
  "field-start-moisture": RadioTower,
  "field-end-moisture": RadioTower,
  "water-tank": Droplets,
} as const;

interface SensorStatusProps {
  sensors: IrrigationSensor[];
}

export function SensorStatus({
  sensors,
}: SensorStatusProps) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Sensor Status
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Field monitoring
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Monitor irrigation-related sensor readings across your farm.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {sensors.map((sensor) => {
          const Icon =
            SENSOR_ICONS[
              sensor.id as keyof typeof SENSOR_ICONS
            ] ?? Gauge;

          return (
            <div
              key={sensor.id}
              className="rounded-xl border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {sensor.status}
                </span>
              </div>

              <p className="mt-5 text-sm text-muted-foreground">
                {sensor.name}
              </p>

              <p className="mt-1 text-3xl font-bold">
                {sensor.value}
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  {sensor.unit}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}