"use client";

import { useState } from "react";
import { CheckCircle2, Droplets, Play, Square, Timer } from "lucide-react";

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

interface IrrigationControlProps {
  farmName: string;
}

export function IrrigationControl({
  farmName,
}: IrrigationControlProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(45);

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Droplets className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Irrigation Control
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                Manual irrigation
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Start irrigation manually for{" "}
            <span className="font-medium text-foreground">
              {farmName}
            </span>{" "}
            and choose how long the system should run.
          </p>
        </div>

        {/* Status */}
        <div
          className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            isRunning
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isRunning ? "bg-primary animate-pulse" : "bg-muted-foreground"
            }`}
          />

          {isRunning ? "Irrigation running" : "System stopped"}
        </div>
      </div>

      {/* Duration */}
      <div className="mt-7">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />

          <p className="text-sm font-semibold">
            Irrigation duration
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {DURATION_OPTIONS.map((option) => {
            const selected = duration === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setDuration(option)}
                className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {option}
                <span className="ml-1 text-xs font-medium opacity-80">
                  min
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setIsRunning(true)}
          disabled={isRunning}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Play className="h-4 w-4 fill-current" />
          Start Irrigation
        </button>

        <button
          type="button"
          onClick={() => setIsRunning(false)}
          disabled={!isRunning}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-background px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <Square className="h-4 w-4 fill-current" />
          Stop Irrigation
        </button>
      </div>

      {/* Status Card */}
      <div
        className={`mt-5 rounded-xl border p-4 transition-colors ${
          isRunning
            ? "border-primary/20 bg-primary/5"
            : "border-border bg-muted/30"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isRunning
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              Current status
            </p>

            <p className="mt-1 text-sm font-semibold leading-6">
              {isRunning
                ? `${farmName} irrigation is running for ${duration} minutes.`
                : `${farmName} irrigation is currently stopped.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}