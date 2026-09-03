"use client";

import Link from "next/link";

import {
  CloudSun,
  MapPinOff,
  Plus,
  Sprout,
} from "lucide-react";

import {
  CurrentWeatherHero,
} from "@/features/weather/components/current-weather-hero";

import {
  useWeatherCenter,
} from "@/features/weather/components/hooks/use-weather-center";

import {
  FarmSelector,
} from "@/features/farms/components/farm-selector";

import {
  useFarm,
} from "@/features/farms/context/farm-context";

export default function WeatherPage() {
  const {
    farms,
    selectedFarmId,
    setSelectedFarmId,
  } = useFarm();

  const selectedFarm =
    farms.find(
      (farm) =>
        farm.id === selectedFarmId,
    ) ?? farms[0];

  const {
    data,
    isWeatherLoading,
    weatherError,
  } = useWeatherCenter(
    selectedFarm?.coordinates,
  );

  if (farms.length === 0) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
            Weather
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Weather Center
          </h1>
        </header>

        <section className="mt-8 flex min-h-105 items-center justify-center rounded-3xl border bg-card p-8 shadow-sm">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sprout className="h-7 w-7 text-primary" />
            </div>

            <h2 className="mt-6 text-xl font-bold sm:text-2xl">
              Add a farm first
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Weather data is connected to
              the exact location of each farm
              or garden.
            </p>

            <Link
              href="/farms/new"
              className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Farm / Garden
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!selectedFarm) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <CloudSun className="h-5 w-5" />

            <p className="text-xs font-semibold uppercase tracking-[0.18em] sm:text-sm">
              Weather
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Weather Center
          </h1>

          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Live conditions and forecasts
            for your exact farm location.
          </p>
        </div>

        <div className="w-full lg:w-auto lg:min-w-64">
          <FarmSelector
            farms={farms}
            selectedFarmId={
              selectedFarm.id
            }
            onFarmChange={
              setSelectedFarmId
            }
          />
        </div>
      </header>

      {!selectedFarm.coordinates ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <MapPinOff className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold">
                Farm location not configured
              </h2>

              <p className="mt-1.5 text-sm text-muted-foreground">
                Add exact coordinates for{" "}
                <span className="font-medium text-foreground">
                  {selectedFarm.name}
                </span>{" "}
                to load local weather.
              </p>
            </div>

            <Link
              href={`/farms/${selectedFarm.id}/edit`}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted"
            >
              Configure Location
            </Link>
          </div>
        </section>
      ) : isWeatherLoading ? (
        <section className="min-h-107.5 animate-pulse rounded-3xl border bg-muted/60 sm:min-h-117.5" />
      ) : weatherError || !data ? (
        <section className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8">
          <h2 className="font-semibold text-destructive">
            Weather unavailable
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Unable to load weather data for
            this farm right now.
          </p>
        </section>
      ) : (

       <CurrentWeatherHero
            data={data}
            farmName={selectedFarm.name}
        />

      )}
    </main>
  );
}