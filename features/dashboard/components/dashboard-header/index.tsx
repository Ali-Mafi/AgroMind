import { ChevronDown, MapPin } from "lucide-react";

const DEMO_FARM = {
  name: "Zaqeh Farm",
  location: "Qazvin, Iran",
};

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Farm Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Farm Overview
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Monitor your farm conditions and make smarter decisions.
        </p>
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 rounded-2xl border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/50 sm:w-auto sm:min-w-60"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <MapPin className="h-4 w-4 text-primary" />
          </div>

          <div>
            <p className="text-sm font-semibold">
              {DEMO_FARM.name}
            </p>

            <p className="text-xs text-muted-foreground">
              {DEMO_FARM.location}
            </p>
          </div>
        </div>

        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
    </header>
  );
}