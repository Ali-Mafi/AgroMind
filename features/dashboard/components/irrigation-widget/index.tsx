"use client";

import { useTranslation } from "@/features/settings/hooks/use-translation";
import { T } from "@/features/settings/components/translated-text";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Clock3,
  Droplets,
} from "lucide-react";

import type { IrrigationSchedule } from "@/features/irrigation/types/irrigation";
import { useSettings } from "@/features/settings/context/settings-context";
import { parseLocalDate } from "@/features/settings/lib/calendar";

interface IrrigationWidgetProps {
  schedule?: IrrigationSchedule;
}

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



export function IrrigationWidget({
  schedule,
}: IrrigationWidgetProps) {
  const t = useTranslation();
  const { format } = useSettings();
  const [currentTime, setCurrentTime] =
    useState<number | null>(null);

  useEffect(() => {
    function updateCurrentTime() {
      setCurrentTime(Date.now());
    }

    updateCurrentTime();

    const interval = window.setInterval(
      updateCurrentTime,
      60_000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  if (!schedule) {
    return (
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Droplets className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><T text="Irrigation" /></p>

            <h2 className="mt-1 text-lg font-bold tracking-tight"><T text="No irrigation scheduled" /></h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground"><T text="There is currently no irrigation schedule for this property." /></p>

            <Link
              href="/irrigation"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
            ><T text="Schedule irrigation" /><ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const scheduleTimestamp = getScheduleTimestamp(
    schedule.date,
    schedule.time,
  );

  const isPastDue =
    currentTime !== null &&
    scheduleTimestamp <= currentTime;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Droplets className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><T text="Irrigation" /></p>

            <h2 className="mt-1 text-lg font-bold tracking-tight"><T text="Irrigation Schedule" /></h2>

            <p className="mt-1 text-sm text-muted-foreground"><T text="Current schedule for the active property." /></p>
          </div>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            isPastDue
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          {currentTime === null
            ? t("Scheduled")
            : isPastDue
              ? t("Past due")
              : t("Scheduled")}
        </span>
      </div>

      {/* Schedule Data */}
      <div className="grid gap-px bg-border sm:grid-cols-3">
        <div className="bg-card p-5 sm:p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <CalendarClock className="h-4 w-4 text-primary" />
          </div>

          <p className="mt-4 text-xs font-medium text-muted-foreground"><T text="Date" /></p>

          <p className="mt-1 font-bold">
            {format.date(parseLocalDate(schedule.date) ?? new Date())}
          </p>
        </div>

        <div className="bg-card p-5 sm:p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Clock3 className="h-4 w-4 text-primary" />
          </div>

          <p className="mt-4 text-xs font-medium text-muted-foreground"><T text="Start Time" /></p>

          <p className="mt-1 font-bold">
            {format.clock(schedule.time)}
          </p>
        </div>

        <div className="bg-card p-5 sm:p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Droplets className="h-4 w-4 text-primary" />
          </div>

          <p className="mt-4 text-xs font-medium text-muted-foreground"><T text="Duration" /></p>

          <p className="mt-1 font-bold">
            {schedule.duration}{" "}<T text="min" /></p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/20 px-5 py-4 sm:px-6">
        <Link
          href="/irrigation"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        ><T text="Manage irrigation" /><ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
