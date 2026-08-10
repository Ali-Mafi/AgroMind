"use client";

import { useState } from "react";
import { Droplets, Play, Square } from "lucide-react";

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
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Irrigation Control
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Manual irrigation
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Start irrigation manually for {farmName} and choose the desired duration.
            </p>
        </div>

        <div className="rounded-xl bg-primary/10 p-3">
          <Droplets className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium">
          Irrigation duration
        </p>

        <div className="mt-3 grid grid-cols-5 gap-2">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDuration(option)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                duration === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {option}m
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setIsRunning(true)}
          disabled={isRunning}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          Start Irrigation
        </button>

        <button
          type="button"
          onClick={() => setIsRunning(false)}
          disabled={!isRunning}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Square className="h-4 w-4" />
          Stop Irrigation
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">
          Current status
        </p>

        <p className="mt-1 font-semibold">
            {isRunning
            ? `${farmName} irrigation running for ${duration} minutes`
            : `${farmName} irrigation is currently stopped`}
        </p>
      </div>
    </section>
  );
}