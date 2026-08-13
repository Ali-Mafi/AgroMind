"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Plus } from "lucide-react";
import Link from "next/link";

export default function NewFarmPage() {
  const [step, setStep] = useState(1);

  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");

  const area =
    Number(length) > 0 && Number(width) > 0
      ? Number(length) * Number(width)
      : 0;

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/farms"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Farms
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">
          Farm Management
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Add New Farm
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Add your farm information step by step.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item}>
            <div
              className={`h-2 rounded-full ${
                item <= step ? "bg-primary" : "bg-muted"
              }`}
            />

            <p className="mt-2 text-xs text-muted-foreground">
              Step {item}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">
                Farm Information
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Start by entering your farm name.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">
                Farm Name
              </label>

              <input
                type="text"
                value={farmName}
                onChange={(event) =>
                  setFarmName(event.target.value)
                }
                placeholder="e.g. Zaqeh Farm"
                className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">
                Farm Location
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Enter your farm location.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">
                Location
              </label>

              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  placeholder="e.g. Qazvin, Iran"
                  className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">
                Farm Dimensions
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Enter the length and width of your farm.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">
                  Length (meters)
                </label>

                <input
                  type="number"
                  min="0"
                  value={length}
                  onChange={(event) =>
                    setLength(event.target.value)
                  }
                  placeholder="450"
                  className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Width (meters)
                </label>

                <input
                  type="number"
                  min="0"
                  value={width}
                  onChange={(event) =>
                    setWidth(event.target.value)
                  }
                  placeholder="90"
                  className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="rounded-xl bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">
                Estimated Area
              </p>

              <p className="mt-1 text-2xl font-bold text-primary">
                {area.toLocaleString()} m²
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">
                Review Farm
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Check your information before creating the farm.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Farm Name
                </p>

                <p className="mt-1 font-semibold">
                  {farmName || "Not specified"}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Location
                </p>

                <p className="mt-1 font-semibold">
                  {location || "Not specified"}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Dimensions
                </p>

                <p className="mt-1 font-semibold">
                  {length || 0}m × {width || 0}m
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Area
                </p>

                <p className="mt-1 font-semibold">
                  {area.toLocaleString()} m²
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert("Farm creation will be connected to the backend later.");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create Farm
            </button>
          </div>
        )}

        <div className="mt-8 flex justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((current) => current - 1)}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>
    </main>
  );
}