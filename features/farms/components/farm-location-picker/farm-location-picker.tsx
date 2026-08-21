"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  Crosshair,
  MapPin,
  X,
} from "lucide-react";

import type { FarmLocation } from "@/features/farms/types/farms";

const FarmMap = dynamic(
  () => import("./farm-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-2xl bg-muted/40">
        <div className="text-sm text-muted-foreground">
          Loading map...
        </div>
      </div>
    ),
  },
);

interface FarmLocationPickerProps {
  value?: FarmLocation;
  onChange: (location: FarmLocation) => void;
}

export default function FarmLocationPicker({
  value,
  onChange,
}: FarmLocationPickerProps) {
  const [open, setOpen] = useState(false);

  const [selectedLocation, setSelectedLocation] =
    useState<FarmLocation | undefined>(value);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedLocation(value);
  }, [value]);

  const handleMapSelect = (location: FarmLocation) => {
    setSelectedLocation(location);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        alert(
          "Unable to get your current location. Please allow location access.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleConfirm = () => {
    if (!selectedLocation) return;

    onChange(selectedLocation);
    setOpen(false);
  };

  return (
    <>
      {/* Location picker trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-4 rounded-2xl border bg-background p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
          <MapPin className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {selectedLocation
              ? "Location selected"
              : "Select exact location"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {selectedLocation
              ? `${selectedLocation.latitude.toFixed(
                  6,
                )}, ${selectedLocation.longitude.toFixed(6)}`
              : "Choose the exact position of your farm on the map"}
          </p>
        </div>

        <span className="shrink-0 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {selectedLocation ? "Change" : "Open Map"}
        </span>
      </button>

      {/* Map modal */}
      {open && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm sm:px-5"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="farm-location-title"
            className="flex h-[min(92vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id="farm-location-title"
                  className="text-lg font-bold sm:text-xl"
                >
                  Select Farm Location
                </h2>

                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Click on the map to place the exact location.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close map"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Map */}
            <div className="relative min-h-0 flex-1">
              <FarmMap
                location={selectedLocation}
                onSelect={handleMapSelect}
              />

              {/* Current location */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="absolute bottom-4 right-4 z-500 inline-flex items-center gap-2 rounded-xl border bg-card/95 px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur transition-all hover:border-primary hover:bg-card hover:text-primary"
              >
                <Crosshair className="h-4 w-4" />
                Use my location
              </button>

              {/* Coordinates */}
              {selectedLocation && (
                <div className="absolute left-4 top-4 z-500 rounded-xl border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Selected coordinates
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    {selectedLocation.latitude.toFixed(6)},{" "}
                    {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <p className="text-xs text-muted-foreground">
                More precise location = better weather data.
              </p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-11 rounded-xl border px-5 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!selectedLocation}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Save Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}