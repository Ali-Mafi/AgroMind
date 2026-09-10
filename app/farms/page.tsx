"use client";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { T } from "@/features/settings/components/translated-text";
import { useSettings } from "@/features/settings/context/settings-context";

import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Plus,
  Ruler,
  TreePine,
  Wheat,
} from "lucide-react";

import { useFarm } from "@/features/farms/context/farm-context";

export default function FarmsPage() {
  const t = useTranslation();
  const { format } = useSettings();
  const { farms, setSelectedFarmId } = useFarm();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-0">
      <header className="space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm"><T text="Farm Management" /></p>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"><T text="My Farms & Gardens" /></h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground"><T text="Manage your farms and gardens in one place." /></p>
          </div>

          <Link
            href="/farms/new"
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4" /><T text="Add Farm / Garden" /></Link>
        </div>
      </header>

      {farms.length > 0 ? (
        <section
          aria-label={t("My farms and gardens")}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {farms.map((farm) => {
            const isGarden = farm.type === "garden";

            return (
              <article
                key={farm.id}
                className="group flex min-h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Link href={`/farms/${farm.id}`} className="flex flex-1 flex-col focus-visible:outline-none">
                <div className="border-b px-5 py-5 sm:px-6 sm:py-6">
                  <div className="flex items-start gap-4">
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

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold sm:text-lg">
                          {farm.name}
                        </h2>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                            isGarden
                              ? "bg-gold/15 text-gold"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {t(isGarden ? "Garden" : "Farm")}
                        </span>
                      </div>

                      <div className="mt-2.5 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{farm.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
                  <div className="rounded-xl bg-muted/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Ruler className="h-3.5 w-3.5" /><T text="Area" /></div>

                    <p className="mt-2 text-lg font-bold tracking-tight">
                      {format.measure(farm.area, isGarden ? "gardenArea" : "area")}

                    </p>
                  </div>

                  {farm.type === "farm" && farm.crop && (
                    <div className="rounded-xl border border-primary/10 bg-primary/4 p-4">
                      <p className="text-xs font-medium text-muted-foreground"><T text="Crop" /></p>

                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5">
                        {farm.crop.name}
                      </p>
                    </div>
                  )}

                  {isGarden && (
                    <div className="rounded-xl border border-gold/20 bg-gold/[0.06] p-4">
                      <p className="text-xs font-medium text-muted-foreground"><T text="Property type" /></p>

                      <p className="mt-2 text-sm font-semibold"><T text="Garden / Orchard" /></p>
                    </div>
                  )}
                </div>

                </Link>

                <div className="grid gap-2 border-t bg-muted/20 px-5 py-4 sm:px-6">
                  <Link href={`/farms/${farm.id}`} className="flex min-h-9 items-center justify-between rounded-lg text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <T text="View details" /><ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                  <Link href="/dashboard" onClick={() => setSelectedFarmId(farm.id)} className="flex min-h-9 items-center justify-center rounded-lg border bg-background px-3 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <T text="Go to dashboard" />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Wheat className="h-6 w-6 text-primary" />
          </div>

          <h2 className="mt-5 text-lg font-semibold"><T text="No farms or gardens yet" /></h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground"><T text="Add your first farm or garden to start managing irrigation, crops, weather, and AI recommendations." /></p>

          <Link
            href="/farms/new"
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" /><T text="Add Farm / Garden" /></Link>
        </section>
      )}
    </main>
  );
}
