import Link from "next/link";
import {
  ArrowRight,
  RadioTower,
} from "lucide-react";

export function SensorSummary() {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <RadioTower className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Sensors
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight">
              No sensors connected
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              AgroMind has not received any field sensor data for
              this property yet.
            </p>
          </div>
        </div>

        <span className="w-fit shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          Not connected
        </span>
      </div>

      <div className="mt-5 rounded-xl border border-dashed bg-muted/20 px-4 py-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Soil moisture and other field readings will appear here
          when compatible AgroMind sensors are connected.
        </p>
      </div>

      <div className="mt-5">
        <Link
          href="/irrigation"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        >
          View irrigation & sensors
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}