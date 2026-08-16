import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Ruler,
  TreePine,
  Wheat,
} from "lucide-react";

import { FARMS } from "@/features/farms/constants/farms";

interface FarmDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FarmDetailsPage({
  params,
}: FarmDetailsPageProps) {
  const { id } = await params;

  const farm = FARMS.find((item) => item.id === id);

  if (!farm) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-0">
        <Link
          href="/farms"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Farms
        </Link>

        <section className="mt-8 rounded-2xl border bg-card p-6 text-center shadow-sm sm:mt-10 sm:p-10">
          <h1 className="text-2xl font-bold">
            Farm not found
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            The selected farm or garden does not exist.
          </p>
        </section>
      </main>
    );
  }

  const isGarden = farm.type === "garden";

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-0">
      {/* Header */}
      <header className="space-y-6">
        <Link
          href="/farms"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Farms
        </Link>

        <div className="flex items-start gap-4 sm:gap-5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${
              isGarden
                ? "bg-gold/15 text-gold"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isGarden ? (
              <TreePine className="h-6 w-6 sm:h-7 sm:w-7" />
            ) : (
              <Wheat className="h-6 w-6 sm:h-7 sm:w-7" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                isGarden
                  ? "bg-gold/15 text-gold"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {farm.type}
            </span>

            <h1 className="mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {farm.name}
            </h1>

            <div className="mt-3 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />

              <span className="truncate">
                {farm.location}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Overview */}
      <section
        aria-label="Farm overview"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2"
      >
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Ruler className="h-5 w-5 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Area
              </p>

              <p className="mt-1.5 text-xl font-bold tracking-tight">
                {farm.area.toLocaleString()}{" "}
                <span className="text-sm font-medium text-muted-foreground">
                  m²
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
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
              <p className="text-sm text-muted-foreground">
                Type
              </p>

              <p className="mt-1.5 text-xl font-bold capitalize">
                {farm.type}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Farm / Garden Information */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">
            {isGarden
              ? "Garden Information"
              : "Farm Information"}
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Basic information about this{" "}
            {isGarden ? "garden" : "farm"}.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="rounded-xl border bg-background p-4 sm:p-5">
            <p className="text-xs font-medium text-muted-foreground">
              Name
            </p>

            <p className="mt-2 break-words text-sm font-semibold">
              {farm.name}
            </p>
          </div>

          <div className="rounded-xl border bg-background p-4 sm:p-5">
            <p className="text-xs font-medium text-muted-foreground">
              Location
            </p>

            <p className="mt-2 break-words text-sm font-semibold">
              {farm.location}
            </p>
          </div>

          <div className="rounded-xl border bg-background p-4 sm:p-5">
            <p className="text-xs font-medium text-muted-foreground">
              Area
            </p>

            <p className="mt-2 text-sm font-semibold">
              {farm.area.toLocaleString()} m²
            </p>
          </div>

          {!isGarden && farm.crop && (
            <div className="rounded-xl border bg-background p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Crop
              </p>

              <p className="mt-2 break-words text-sm font-semibold leading-5">
                {farm.crop.name}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}