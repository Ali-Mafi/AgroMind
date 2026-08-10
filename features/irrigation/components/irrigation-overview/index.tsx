import {
  CalendarClock,
  Droplets,
  Timer,
} from "lucide-react";

import type { IrrigationOverview as IrrigationOverviewData } from "@/features/irrigation/types/irrigation";

interface IrrigationOverviewProps {
  irrigation: IrrigationOverviewData;
}

export function IrrigationOverview({
  irrigation,
}: IrrigationOverviewProps) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Irrigation Overview
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Current irrigation plan
          </h2>
        </div>

        <div className="rounded-xl bg-primary/10 p-3">
          <Droplets className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            Status
          </div>

          <p className="mt-2 font-semibold">
            {irrigation.status}
          </p>
        </div>

        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            Next Run
          </div>

          <p className="mt-2 font-semibold">
            {irrigation.nextRun}
          </p>
        </div>

        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            Duration
          </div>

          <p className="mt-2 font-semibold">
            {irrigation.duration}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <Droplets className="h-5 w-5 text-primary" />

        <div>
          <p className="text-xs text-muted-foreground">
            Estimated Water Usage
          </p>

          <p className="font-semibold">
            {irrigation.waterAmount}
          </p>
        </div>
      </div>
    </section>
  );
}