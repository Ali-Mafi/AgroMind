"use client";

import { useState } from "react";
import {
  CalendarClock,
  Check,
  Clock3,
  Save,
} from "lucide-react";

import type { IrrigationSchedule as IrrigationScheduleData } from "@/features/irrigation/types/irrigation";

interface IrrigationScheduleProps {
  farmName: string;
  farmId: string;
  schedule?: IrrigationScheduleData;
  onSave: (schedule: IrrigationScheduleData) => void;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

export function IrrigationSchedule({
  farmName,
  farmId,
  schedule,
  onSave,
}: IrrigationScheduleProps) {
  const [date, setDate] = useState(schedule?.date ?? "");
  const [time, setTime] = useState(schedule?.time ?? "");
  const [duration, setDuration] = useState(
    schedule?.duration ?? 45,
  );

  const canSave = Boolean(date && time);

  function handleSave() {
    if (!canSave) {
      return;
    }

    onSave({
      date,
      time,
      duration,
    });
  }

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
          <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
            Irrigation Schedule
          </p>

          <h2 className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">
            Schedule irrigation
          </h2>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Plan the next irrigation session for{" "}
            <span className="font-medium text-foreground">
              {farmName}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Schedule Inputs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Date */}
        <div className="rounded-2xl border bg-background p-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />

            <label
              htmlFor={`irrigation-date-${farmId}`}
              className="text-sm font-semibold"
            >
              Date
            </label>
          </div>

          <input
            id={`irrigation-date-${farmId}`}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-3 h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Time */}
        <div className="rounded-2xl border bg-background p-4">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />

            <label
              htmlFor={`irrigation-time-${farmId}`}
              className="text-sm font-semibold"
            >
              Start Time
            </label>
          </div>

          <input
            id={`irrigation-time-${farmId}`}
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="mt-3 h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Duration */}
      <div className="mt-5 rounded-2xl border bg-background p-4 sm:p-5">
        <div>
          <p className="text-sm font-semibold">
            Irrigation Duration
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Choose how long the irrigation should run.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {DURATION_OPTIONS.map((option) => {
            const selected = duration === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setDuration(option)}
                className={`relative flex min-h-11 items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                }`}
              >
                {selected && (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                )}

                {option} min
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <Save className="h-4 w-4" />
        Save Schedule
      </button>

      {/* Summary */}
      {canSave && (
        <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
              <CalendarClock className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">
                Schedule ready
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Irrigation for{" "}
                <span className="font-medium text-foreground">
                  {farmName}
                </span>{" "}
                is scheduled for{" "}
                <span className="font-semibold text-foreground">
                  {date}
                </span>{" "}
                at{" "}
                <span className="font-semibold text-foreground">
                  {time}
                </span>{" "}
                for{" "}
                <span className="font-semibold text-foreground">
                  {duration} minutes
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}