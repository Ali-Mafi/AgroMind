"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  MapPin,
  X,
} from "lucide-react";

import { useRegion } from "@/features/region/context/region-context";

type PermissionState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied";

export function LocationPermission() {
  const { detectRegionFromLocation } = useRegion();

  const [state, setState] =
    useState<PermissionState>("idle");

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
      return;
    }

    if (!navigator.permissions) {
      return;
    }

    let cancelled = false;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((permission) => {
        if (cancelled) {
          return;
        }

        if (permission.state === "granted") {
          setVisible(false);
        }

        if (permission.state === "denied") {
          setVisible(false);
        }
      })
      .catch(() => {
        // Permissions API is optional.
      });

    return () => {
      cancelled = true;
    };
  }, []);

        async function handleAllowLocation() {
        setState("requesting");

        try {
            await detectRegionFromLocation();

            setState("granted");
            setVisible(false);
        } catch {
            setState("denied");
            setVisible(false);
        }
    }

  function handleNotNow() {
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Location
            </p>

            <h2 className="mt-1 text-base font-semibold sm:text-lg">
              Make AgroMind more local
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
              Allow location access to personalize your
              region, dates, weather, and local information.
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleNotNow}
            disabled={state === "requesting"}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Not now
          </button>

          <button
            type="button"
            onClick={handleAllowLocation}
            disabled={state === "requesting"}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "requesting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Allow Location
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}