import Link from "next/link";
import {
  ArrowRight,
  Droplets,
  MapPin,
  Ruler,
  Sprout,
  TreePine,
  Wheat,
} from "lucide-react";

import type { Farm } from "@/features/farms/types/farms";
import { useSettings } from "@/features/settings/context/settings-context";
import { formatArea } from "@/features/settings/utils/area-formatter";

interface ActivePropertySummaryProps {
  farm: Farm;
}

const IRRIGATION_LABELS: Record<string, string> = {
  flood: "Flood Irrigation",
  drip: "Drip Irrigation",
  sprinkler: "Sprinkler Irrigation",
  other: "Other",
};

export function ActivePropertySummary({
  farm,
}: ActivePropertySummaryProps) {
  const { areaUnit } = useSettings();

  const isGarden = farm.type === "garden";

  const plantTypes = farm.plants?.length ?? 0;

  const totalPlants =
    farm.plants?.reduce(
      (total, plant) => total + plant.quantity,
      0,
    ) ?? 0;

  const irrigationLabel = farm.irrigationType
    ? IRRIGATION_LABELS[farm.irrigationType] ??
      farm.irrigationType
    : "Not specified";

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Property Header */}
      <div className="border-b p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                isGarden
                  ? "bg-gold/15 text-gold"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {isGarden ? (
                <TreePine className="h-5 w-5" />
              ) : (
                <Wheat className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Active Property
                </p>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    isGarden
                      ? "bg-gold/15 text-gold"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {isGarden ? "Garden" : "Farm"}
                </span>
              </div>

              <h2 className="mt-2 truncate text-xl font-bold tracking-tight sm:text-2xl">
                {farm.name}
              </h2>

              <div className="mt-2 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />

                <span className="truncate">
                  {farm.location}
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/farms/${farm.id}`}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            View Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Property Data */}
      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {/* Area */}
        <div className="bg-card p-5 sm:p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Ruler className="h-4 w-4 text-primary" />
          </div>

          <p className="mt-4 text-xs font-medium text-muted-foreground">
            Area
          </p>

          <p className="mt-1 text-lg font-bold">
            {formatArea(farm.area, areaUnit)}
          </p>
        </div>

        {/* Property Type */}
        <div className="bg-card p-5 sm:p-6">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isGarden
                ? "bg-gold/15 text-gold"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isGarden ? (
              <TreePine className="h-4 w-4" />
            ) : (
              <Wheat className="h-4 w-4" />
            )}
          </div>

          <p className="mt-4 text-xs font-medium text-muted-foreground">
            Property Type
          </p>

          <p className="mt-1 text-lg font-bold">
            {isGarden ? "Garden / Orchard" : "Farm"}
          </p>
        </div>

        {/* Crop / Plant Types */}
        <div className="bg-card p-5 sm:p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Sprout className="h-4 w-4 text-primary" />
          </div>

          <p className="mt-4 text-xs font-medium text-muted-foreground">
            {isGarden ? "Plant / Tree Types" : "Primary Crop"}
          </p>

          <p className="mt-1 line-clamp-2 text-lg font-bold">
            {isGarden
              ? plantTypes > 0
                ? `${plantTypes} type${plantTypes === 1 ? "" : "s"}`
                : "Not specified"
              : farm.crop?.name ?? "Not specified"}
          </p>
        </div>

        {/* Irrigation / Plant Count */}
        <div className="bg-card p-5 sm:p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Droplets className="h-4 w-4 text-primary" />
          </div>

          <p className="mt-4 text-xs font-medium text-muted-foreground">
            {isGarden ? "Total Plants / Trees" : "Irrigation"}
          </p>

          <p className="mt-1 line-clamp-2 text-lg font-bold">
            {isGarden
              ? totalPlants > 0
                ? totalPlants.toLocaleString()
                : "Not specified"
              : irrigationLabel}
          </p>
        </div>
      </div>
    </section>
  );
}