import Link from "next/link";
import { MapPin, Plus, Ruler, TreePine, Wheat } from "lucide-react";

import { FARMS } from "@/features/farms/constants/farms";

export default function FarmsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Farm Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My Farms & Gardens
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Manage your farms and gardens in one place.
          </p>
        </div>

        <Link
          href="/farms/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Farm / Garden
        </Link>
      </header>

      {/* Farm Cards */}
      {FARMS.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FARMS.map((farm) => (
            <Link
              key={farm.id}
              href={`/farms/${farm.id}`}
              className="group block overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between border-b p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3">
                    {farm.type === "garden" ? (
                      <TreePine className="h-5 w-5 text-primary" />
                    ) : (
                      <Wheat className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      {farm.name}
                    </h2>

                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                      {farm.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-4 p-5">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="text-muted-foreground">
                    {farm.location}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Ruler className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="text-muted-foreground">
                    {farm.area.toLocaleString()} m²
                  </span>
                </div>

                {farm.type === "farm" && farm.crop && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      Crop
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {farm.crop.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="border-t bg-muted/20 px-5 py-4">
                <span className="text-sm font-semibold text-primary transition-colors group-hover:text-primary/80">
                  View details →
                </span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        /* Empty State */
        <section className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Wheat className="h-6 w-6 text-primary" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            No farms or gardens yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Add your first farm or garden to start managing irrigation,
            crops, weather, and AI recommendations.
          </p>

          <Link
            href="/farms/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Farm / Garden
          </Link>
        </section>
      )}
    </main>
  );
}