"use client";

import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Plus,
  Sprout,
  TreePine,
  Wheat,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { useFarm } from "@/features/farms/context/farm-context";
import WeatherDashboard from "@/features/weather/components/weather-dashboard";

export function DashboardOverview() {
  const {
    farms,
    selectedFarmId,
  } = useFarm();

  if (farms.length === 0) {
    return (
      <div className="space-y-6">
        <DashboardHeader />

        <section className="flex min-h-105 items-center justify-center rounded-2xl border bg-card px-6 py-12 shadow-sm">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sprout className="h-7 w-7 text-primary" />
            </div>

            <h2 className="mt-6 text-xl font-bold tracking-tight sm:text-2xl">
              Start with your first farm
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Add a farm or garden to start monitoring weather,
              irrigation, field conditions, and future AI insights.
            </p>

            <Link
              href="/farms/new"
              className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Add Farm / Garden
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const selectedFarm =
    farms.find(
      (farm) => farm.id === selectedFarmId,
    ) ?? farms[0];

  if (!selectedFarm) {
    return null;
  }

  const isGarden = selectedFarm.type === "garden";

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-5 sm:p-6">
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

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Active property
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                {selectedFarm.name}
              </h2>

              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />

                <span className="truncate">
                  {selectedFarm.location}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-dashed bg-muted/20 px-5 py-8 text-center">
            <h3 className="text-base font-semibold">
              Dashboard data is being connected
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Weather, irrigation, sensor readings, and AI insights
              will appear here only when they are backed by real
              AgroMind data sources.
            </p>

            <Link
              href={`/farms/${selectedFarm.id}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
            >
              View farm details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {selectedFarm.coordinates ? (
  <WeatherDashboard
    coordinates={selectedFarm.coordinates}
  />
) : (
  <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Weather
      </p>

      <h2 className="mt-2 text-lg font-semibold">
        Farm location is not configured
      </h2>

      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Add the exact farm location to enable live weather data
        for this property.
      </p>

      <Link
        href={`/farms/${selectedFarm.id}/edit`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
      >
        Add farm location
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </section>
)}

    </div>
  );
}