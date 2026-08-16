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
  farmName: string;
}

export function SensorStatus({
  sensors,
  farmName,
}: SensorStatusProps) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
          <RadioTower className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
            Sensor Status
          </p>

          <h2 className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">
            Field monitoring
          </h2>

          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            Live sensor status for{" "}
            <span className="font-medium text-foreground">
              {farmName}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Sensors */}
      {sensors.length > 0 ? (
        <div
          className={`mt-6 grid gap-3 ${
            sensors.length === 1
              ? "grid-cols-1"
              : sensors.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {sensors.map((sensor) => {
            const Icon =
              SENSOR_ICONS[
                sensor.id as keyof typeof SENSOR_ICONS
              ] ?? Gauge;

            return (
              <div
                key={sensor.id}
                className="rounded-2xl border bg-background p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {sensor.status}
                  </span>
                </div>

                <p className="mt-5 text-sm font-medium text-muted-foreground">
                  {sensor.name}
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {sensor.value}

                  <span className="ml-1 text-sm font-medium text-muted-foreground sm:text-base">
                    {sensor.unit}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
          <RadioTower className="mx-auto h-6 w-6 text-muted-foreground/50" />

          <p className="mt-3 text-sm font-semibold">
            No sensors connected
          </p>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            No irrigation sensors are currently configured for this farm.
          </p>
        </div>
      )}
    </section>
  );
}