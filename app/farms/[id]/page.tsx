import Link from "next/link";
import { ArrowLeft, MapPin, Ruler, TreePine, Wheat } from "lucide-react";

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
      <main className="mx-auto w-full max-w-4xl">
        <Link
          href="/farms"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Farms
        </Link>

        <section className="mt-8 rounded-2xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">
            Farm not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The selected farm or garden does not exist.
          </p>
        </section>
      </main>
    );
  }

  const isGarden = farm.type === "garden";

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8">
      {/* Header */}
      <header>
        <Link
          href="/farms"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Farms
        </Link>

        <div className="mt-6 flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-4">
            {isGarden ? (
              <TreePine className="h-7 w-7 text-primary" />
            ) : (
              <Wheat className="h-7 w-7 text-primary" />
            )}
          </div>

          <div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
              {farm.type}
            </span>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              {farm.name}
            </h1>

            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {farm.location}
            </div>
          </div>
        </div>
      </header>

      {/* Overview */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <Ruler className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Area
              </p>

              <p className="mt-1 text-xl font-bold">
                {farm.area.toLocaleString()} m²
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              {isGarden ? (
                <TreePine className="h-5 w-5 text-primary" />
              ) : (
                <Wheat className="h-5 w-5 text-primary" />
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Type
              </p>

              <p className="mt-1 text-xl font-bold capitalize">
                {farm.type}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Farm information */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">
          {isGarden ? "Garden Information" : "Farm Information"}
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-background p-4">
            <p className="text-xs text-muted-foreground">
              Name
            </p>

            <p className="mt-1 font-semibold">
              {farm.name}
            </p>
          </div>

          <div className="rounded-xl border bg-background p-4">
            <p className="text-xs text-muted-foreground">
              Location
            </p>

            <p className="mt-1 font-semibold">
              {farm.location}
            </p>
          </div>

          <div className="rounded-xl border bg-background p-4">
            <p className="text-xs text-muted-foreground">
              Area
            </p>

            <p className="mt-1 font-semibold">
              {farm.area.toLocaleString()} m²
            </p>
          </div>

          {!isGarden && farm.crop && (
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                Crop
              </p>

              <p className="mt-1 font-semibold">
                {farm.crop.name}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}