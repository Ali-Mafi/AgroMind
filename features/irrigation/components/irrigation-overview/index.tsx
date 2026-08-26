import {
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
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
            <Droplets className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
              Irrigation Overview
            </p>

            <h2 className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">
              Current irrigation plan
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Overview of the current irrigation status and upcoming plan.
            </p>
          </div>
        </div>

        
        {/* Today */}
        
          {/* Irrigation Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Status
              </p>

              <p className="mt-2 text-sm font-semibold sm:text-base">
                {irrigation.status}
              </p>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Next Run
              </p>

              <p className="mt-2 text-sm font-semibold sm:text-base">
                {irrigation.nextRun}
              </p>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Timer className="h-3.5 w-3.5" />
                Duration
              </div>

              <p className="mt-2 text-sm font-semibold sm:text-base">
                {irrigation.duration}
              </p>
            </div>
          </div>

          {/* Water Usage */}
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Droplets className="h-5 w-5 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Estimated Water Usage
              </p>

              <p className="mt-1 text-sm font-semibold sm:text-base">
                {irrigation.waterAmount}
              </p>
            </div>
          </div>
      </div>
    </section>
  );
}