"use client";

import Link from "next/link";
import {
  Plus,
  Sprout,
} from "lucide-react";

import { FarmSelector } from "@/features/farms/components/farm-selector";
import { useFarm } from "@/features/farms/context/farm-context";
import {
  useEffect,
  useState,
} from "react";

import type {
  IrrigationOverview as IrrigationOverviewData,
} from "@/features/irrigation/types/irrigation";

import { IrrigationOverview } from "@/features/irrigation/components/irrigation-overview";
import { IrrigationSchedule } from "@/features/irrigation/components/irrigation-schedule";
import { IrrigationControl } from "@/features/irrigation/components/irrigation-control";
import { SensorStatus } from "@/features/irrigation/components/sensor-status";
import { TodayDateCard } from "@/features/shared/components/today-date-card";

function getScheduleTimestamp(
  date: string,
  time: string,
) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  const [hour, minute] = time
    .split(":")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0,
  ).getTime();
}

export default function IrrigationPage() {

  const [currentTime, setCurrentTime] =
  useState(() => Date.now());

useEffect(() => {
  const interval = window.setInterval(() => {
    setCurrentTime(Date.now());
  }, 60_000);

  return () => {
    window.clearInterval(interval);
  };
}, []);

  const {
    farms,
    selectedFarmId,
    setSelectedFarmId,
    irrigationSchedules,
    setIrrigationSchedule,
  } = useFarm();

  if (farms.length === 0) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8 lg:pt-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
            Irrigation
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Irrigation Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Monitor and manage irrigation for your farms and gardens.
          </p>
        </header>

        <section className="mt-8 flex min-h-105 items-center justify-center rounded-2xl border bg-card px-6 py-12 shadow-sm">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sprout className="h-7 w-7 text-primary" />
            </div>

            <h2 className="mt-6 text-xl font-bold tracking-tight sm:text-2xl">
              Add a farm first
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Irrigation settings, schedules, sensors, and automation
              are connected to individual farms and gardens.
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
      </main>
    );
  }

  const selectedFarm =
    farms.find(
      (farm) => farm.id === selectedFarmId,
    ) ?? farms[0];

  if (!selectedFarm) {
    return null;
  }

  const schedule =
    irrigationSchedules[selectedFarm.id];

  const scheduleTimestamp = schedule
  ? getScheduleTimestamp(
      schedule.date,
      schedule.time,
    )
  : null;

const isPastDue =
  scheduleTimestamp !== null &&
  scheduleTimestamp <= currentTime;

const irrigationOverview:
  IrrigationOverviewData | null = schedule
  ? {
      status: isPastDue
        ? "past-due"
        : "scheduled",
      nextRun: `${schedule.date} at ${schedule.time}`,
      duration: `${schedule.duration} min`,
      waterAmount: "No data",
    }
  : null;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8 lg:pt-10">
      <header className="space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
              Irrigation
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Irrigation Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Monitor and manage irrigation for your farm.
            </p>
          </div>

          <div className="w-full lg:w-auto lg:min-w-64">
            <FarmSelector
              farms={farms}
              selectedFarmId={selectedFarm.id}
              onFarmChange={setSelectedFarmId}
            />
          </div>
        </div>
      </header>

      <TodayDateCard />

      {irrigationOverview ? (
        <IrrigationOverview
          irrigation={irrigationOverview}
          onReschedule={() => {
            document
              .getElementById(
                `irrigation-schedule-${selectedFarm.id}`,
              )
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
          }}
        />
      ) : (
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Irrigation Overview
          </p>

          <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            No irrigation scheduled
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            There is currently no irrigation schedule for{" "}
            <span className="font-medium text-foreground">
              {selectedFarm.name}
            </span>
            . Create a schedule below when you are ready.
          </p>
        </section>
      )}

      <IrrigationSchedule
        key={selectedFarm.id}
        farmId={selectedFarm.id}
        farmName={selectedFarm.name}
        schedule={schedule}
        onSave={(newSchedule) => {
          setIrrigationSchedule(
            selectedFarm.id,
            newSchedule,
          );
        }}
      />

      <section aria-label="Irrigation control">
        <IrrigationControl
          farmName={selectedFarm.name}
        />
      </section>

      <SensorStatus
        sensors={[]}
        farmName={selectedFarm.name}
      />
    </main>
  );
}