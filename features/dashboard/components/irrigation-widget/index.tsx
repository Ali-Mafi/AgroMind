import { Droplets } from "lucide-react";

import { DASHBOARD_IRRIGATION } from "@/features/dashboard/constants/dashboard";

export function IrrigationWidget() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Droplets className="h-5 w-5 text-primary" />
        </div>

        <div>
          <h2 className="font-semibold">
            Irrigation
          </h2>

          <p className="text-sm text-muted-foreground">
            Next scheduled irrigation
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Status
          </p>

          <p className="mt-1 font-semibold">
            {DASHBOARD_IRRIGATION.status}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Next Run
          </p>

          <p className="mt-1 font-semibold">
            {DASHBOARD_IRRIGATION.nextRun}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Duration
          </p>

          <p className="mt-1 font-semibold">
            {DASHBOARD_IRRIGATION.duration}
          </p>
        </div>
      </div>
    </div>
  );
}   