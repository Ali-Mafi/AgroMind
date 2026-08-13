"use client";

import { CalendarClock, Clock, Save } from "lucide-react";

import type { IrrigationSchedule as IrrigationScheduleData } from "@/features/irrigation/types/irrigation";

interface IrrigationScheduleProps {
  farmName: string;
  farmId: string;
  schedule?: IrrigationScheduleData;
  onSave: (schedule: IrrigationScheduleData) => void;
}

export function IrrigationSchedule({
  farmName,
  farmId,
  schedule,
  onSave,
}: IrrigationScheduleProps) {
  const date = schedule?.date ?? "";
  const time = schedule?.time ?? "";
  const duration = schedule?.duration ?? 45;

  function updateSchedule(
    changes: Partial<IrrigationScheduleData>,
  ) {
    onSave({
      date,
      time,
      duration,
      ...changes,
    });
  }

  const canSave = Boolean(date && time);

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Irrigation Schedule
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Schedule irrigation
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Plan the next irrigation session for {farmName}.
          </p>
        </div>

        <div className="rounded-xl bg-primary/10 p-3">
          <CalendarClock className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor={`irrigation-date-${farmId}`}
            className="text-sm font-medium"
          >
            Date
          </label>

          <input
            id={`irrigation-date-${farmId}`}
            type="date"
            value={date}
            onChange={(event) => {
              updateSchedule({
                date: event.target.value,
              });
            }}
            className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label
            htmlFor={`irrigation-time-${farmId}`}
            className="text-sm font-medium"
          >
            Time
          </label>

          <div className="relative mt-2">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              id={`irrigation-time-${farmId}`}
              type="time"
              value={time}
              onChange={(event) => {
                updateSchedule({
                  time: event.target.value,
                });
              }}
              className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`irrigation-duration-${farmId}`}
            className="text-sm font-medium"
          >
            Duration
          </label>

          <select
            id={`irrigation-duration-${farmId}`}
            value={duration}
            onChange={(event) => {
              updateSchedule({
                duration: Number(event.target.value),
              });
            }}
            className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!canSave) {
            return;
          }

          onSave({
            date,
            time,
            duration,
          });
        }}
        disabled={!canSave}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        Save Schedule
      </button>

      {canSave && (
        <div className="mt-4 rounded-xl bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-primary">
            Irrigation schedule
          </p>

          <p className="mt-1 text-muted-foreground">
            {date} at {time} for {duration} minutes.
          </p>
        </div>
      )}
    </section>
  );
}