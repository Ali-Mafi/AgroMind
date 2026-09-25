"use client";
import { Disclosure } from "@/components/ui/disclosure";
import { T } from "@/features/settings/components/translated-text";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { parseLocalDate } from "@/features/settings/lib/calendar";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { useWorkspaceFarm } from "@/features/farms/hooks/use-workspace-farm";
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
import WeatherDashboard from "@/features/weather/components/weather-dashboard";

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
  const { format } = useSettings();
  const t = useTranslation();

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
    irrigationSchedules,
    setIrrigationSchedule,
    deleteIrrigationSchedule,
    busy,
  } = useFarm();

  const { farm: selectedFarm, selectFarm } = useWorkspaceFarm();

  if (farms.length === 0) {
    return (
      <main className="app-page">
        <PageHeader back title={t("Irrigation")} description={t("Monitor and manage irrigation for your farms and gardens.")} />

        <section className="mt-8 flex min-h-105 items-center justify-center rounded-2xl border bg-card px-6 py-12 shadow-sm">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sprout className="h-7 w-7 text-primary" />
            </div>

            <h2 className="mt-6 text-xl font-bold tracking-tight sm:text-2xl"><T text="Add a farm first" /></h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base"><T text="Irrigation settings, schedules, sensors, and automation are connected to individual farms and gardens." /></p>

            <Link
              href="/farms/new"
              className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" /><T text="Add Farm / Garden" /></Link>
          </div>
        </section>
      </main>
    );
  }

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
      nextRun: `${format.date(parseLocalDate(schedule.date) ?? new Date())} · ${format.clock(schedule.time)}`,
      duration: `${format.number(schedule.duration, 0)} ${t("min")}`,
      waterAmount: t("No data"),
    }
  : null;

  return (
    <main className="app-page space-y-6">
      <PageHeader back title={t("Irrigation")} description={selectedFarm.name} action={<div className="w-72 max-w-[calc(100vw-2rem)]"><FarmSelector farms={farms} selectedFarmId={selectedFarm.id} onFarmChange={selectFarm} /></div>} />

      <TodayDateCard />

      {selectedFarm.coordinates && <WeatherDashboard coordinates={selectedFarm.coordinates} farmId={selectedFarm.id} returnTo="/irrigation" />}

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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary"><T text="Irrigation Overview" /></p>

          <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl"><T text="No irrigation scheduled" /></h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground"><T text="There is currently no irrigation schedule for" />{" "}
            <span className="font-medium text-foreground">
              {selectedFarm.name}
            </span><T text=". Create a schedule below when you are ready." /></p>
        </section>
      )}

      <IrrigationSchedule
        key={selectedFarm.id}
        farmId={selectedFarm.id}
        farmName={selectedFarm.name}
        schedule={schedule}
        onSave={(newSchedule) => {
          return setIrrigationSchedule(
            selectedFarm.id,
            newSchedule,
          );
        }}
      />

      {schedule && <button type="button" disabled={busy} onClick={() => void deleteIrrigationSchedule(selectedFarm.id)} className="min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold text-destructive">{t("Remove schedule")}</button>}
      <Disclosure className="app-card p-5" title={t("Controls & sensors")}>
        <div className="mt-5 space-y-5">
          <section aria-label={t("Irrigation control")}>
            <IrrigationControl farmName={selectedFarm.name} />
          </section>
          <SensorStatus sensors={[]} farmName={selectedFarm.name} />
        </div>
      </Disclosure>
    </main>
  );
}
