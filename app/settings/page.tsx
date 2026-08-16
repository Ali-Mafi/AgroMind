"use client";

import { Settings } from "lucide-react";

import { ThemeSwitcher } from "@/app/components/theme-switcher";
import {
  useSettings,
  type AreaUnit,
} from "@/features/settings/context/settings-context";

export default function SettingsPage() {
  const { areaUnit, setAreaUnit } = useSettings();

  const areaUnits: {
    value: AreaUnit;
    label: string;
    symbol: string;
  }[] = [
    {
      value: "sqm",
      label: "Square meters",
      symbol: "m²",
    },
    {
      value: "hectare",
      label: "Hectares",
      symbol: "ha",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-0">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
          Settings
        </p>

        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          App Settings
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Customize AgroMind to match your preferences.
        </p>
      </header>

      {/* Appearance */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Appearance
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Choose how AgroMind looks on your device.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-5 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="font-medium">
              Theme
            </p>

            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Light, dark, or follow your device.
            </p>
          </div>

          <div className="shrink-0">
            <ThemeSwitcher />
          </div>
        </div>
      </section>

      {/* Measurement Units */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:p-7">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">
            Measurement Units
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Choose how land area is displayed throughout AgroMind.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {areaUnits.map((unit) => {
            const selected = areaUnit === unit.value;

            return (
              <button
                key={unit.value}
                type="button"
                onClick={() => setAreaUnit(unit.value)}
                className={`min-h-24 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-5 ${
                  selected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "bg-background hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">
                    {unit.label}
                  </p>

                  {selected && (
                    <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      Selected
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {unit.symbol}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}