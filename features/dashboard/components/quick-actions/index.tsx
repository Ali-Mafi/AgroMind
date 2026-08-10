import { Droplets, Map } from "lucide-react";

interface QuickActionsProps {
  onIrrigationClick?: () => void;
  onMapClick?: () => void;
}

export function QuickActions({
  onIrrigationClick,
  onMapClick,
}: QuickActionsProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          Quick Actions
        </h2>

        <p className="text-sm text-muted-foreground">
          Manage your farm from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onIrrigationClick}
          className="group flex items-center gap-4 rounded-2xl border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="rounded-xl bg-primary/10 p-3">
            <Droplets className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="font-semibold">
              Manage Irrigation
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Control and schedule irrigation.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onMapClick}
          className="group flex items-center gap-4 rounded-2xl border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="rounded-xl bg-primary/10 p-3">
            <Map className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="font-semibold">
              View Farm Map
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Explore your farm boundaries and fields.
            </p>
          </div>
        </button>
      </div>
    </section>
  );
}