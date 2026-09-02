"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Play,
  Square,
  Timer,
  WifiOff,
} from "lucide-react";

import type {
  IrrigationControllerStatus,
} from "@/features/irrigation/types/irrigation";



const DURATION_OPTIONS = [15, 30, 45, 60, 90];

interface IrrigationControlProps {
  farmName: string;

  controllerStatus?: IrrigationControllerStatus;

  isRunning?: boolean;

  duration?: number;

  onDurationChange?: (
    duration: number,
  ) => void;

  onStart?: () => void;

  onStop?: () => void;
}

export function IrrigationControl({
  farmName,
  controllerStatus = "not-connected",
  isRunning = false,
  duration = 45,
  onDurationChange,
  onStart,
  onStop,
}: IrrigationControlProps) {
  const controllerConnected =
    controllerStatus === "connected";

  const controlsReady =
    controllerConnected &&
    Boolean(onStart) &&
    Boolean(onStop);

  const statusLabel = (() => {
    if (
      controllerStatus === "not-connected"
    ) {
      return "Not connected";
    }

    if (controllerStatus === "offline") {
      return "Controller offline";
    }

    if (controllerStatus === "error") {
      return "Controller error";
    }

    if (!controlsReady) {
      return "Control unavailable";
    }

    return isRunning
      ? "Irrigation running"
      : "Ready";
  })();

  const statusDotClass = (() => {
    if (
      controllerStatus === "connected" &&
      controlsReady
    ) {
      return isRunning
        ? "bg-primary animate-pulse"
        : "bg-primary";
    }

    if (
      controllerStatus === "offline" ||
      controllerStatus === "error"
    ) {
      return "bg-destructive";
    }

    return "bg-muted-foreground";
  })();

  const statusBadgeClass =
    controllerConnected && controlsReady
      ? "bg-primary/10 text-primary"
      : controllerStatus === "offline" ||
          controllerStatus === "error"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";

  const controlMessage = (() => {
    if (
      controllerStatus === "not-connected"
    ) {
      return {
        title: "Automation not connected",
        description: `No irrigation controller is connected to ${farmName}. Connect a compatible controller to enable remote start and stop.`,
        destructive: false,
      };
    }

    if (controllerStatus === "offline") {
      return {
        title: "Controller is offline",
        description:
          "Remote irrigation control is temporarily unavailable. Check the controller power and network connection.",
        destructive: true,
      };
    }

    if (controllerStatus === "error") {
      return {
        title: "Controller needs attention",
        description:
          "AgroMind cannot communicate with the irrigation controller. Remote commands are disabled until the connection is restored.",
        destructive: true,
      };
    }

    if (!controlsReady) {
      return {
        title: "Remote control unavailable",
        description:
          "The controller connection exists, but remote irrigation commands are not available yet.",
        destructive: false,
      };
    }

    if (isRunning) {
      return {
        title: "Irrigation in progress",
        description: `${farmName} is currently being irrigated.`,
        destructive: false,
      };
    }

    return {
      title: "Controller ready",
      description: `${farmName} is connected and ready for remote irrigation control.`,
      destructive: false,
    };
  })();

  const controlsDisabled = !controlsReady;

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
                Remote irrigation
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Control irrigation for{" "}
            <span className="font-medium text-foreground">
              {farmName}
            </span>{" "}
            when a compatible irrigation controller
            is connected.
          </p>
        </div>

        {/* Controller Status */}
        <div
          className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${statusBadgeClass}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${statusDotClass}`}
          />

          {statusLabel}
        </div>
      </div>

      {/* Connection State */}
      <div
        className={`mt-6 rounded-xl border p-4 ${
          controlMessage.destructive
            ? "border-destructive/20 bg-destructive/5"
            : controllerConnected &&
                controlsReady
              ? "border-primary/20 bg-primary/5"
              : "border-border bg-muted/30"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              controlMessage.destructive
                ? "bg-destructive/10 text-destructive"
                : controllerConnected &&
                    controlsReady
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {controllerStatus ===
            "not-connected" ? (
              <WifiOff className="h-4 w-4" />
            ) : controlMessage.destructive ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {controlMessage.title}
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {controlMessage.description}
            </p>
          </div>
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
            const selected =
              duration === option;

            return (
              <button
                key={option}
                type="button"
                disabled={
                  controlsDisabled || isRunning
                }
                onClick={() =>
                  onDurationChange?.(option)
                }
                className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  selected &&
                  !controlsDisabled
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-background text-foreground"
                } disabled:cursor-not-allowed disabled:opacity-40`}
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
          onClick={onStart}
          disabled={
            controlsDisabled || isRunning
          }
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <Play className="h-4 w-4 fill-current" />

          Start Irrigation
        </button>

        <button
          type="button"
          onClick={onStop}
          disabled={
            controlsDisabled || !isRunning
          }
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-background px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <Square className="h-4 w-4 fill-current" />

          Stop Irrigation
        </button>
      </div>
    </section>
  );
}