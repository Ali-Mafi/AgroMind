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
    <main className="mx-auto w-full max-w-4xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Settings
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          App Settings
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Customize AgroMind to match your preferences.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <Settings className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              Appearance
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Choose how AgroMind looks on your device.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border bg-background p-4">
          <div>
            <p className="font-medium">Theme</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Light, dark, or follow your device.
            </p>
          </div>

          <ThemeSwitcher />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Measurement Units
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Choose how land area is displayed throughout AgroMind.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {areaUnits.map((unit) => {
            const selected = areaUnit === unit.value;

            return (
              <button
                key={unit.value}
                type="button"
                onClick={() => setAreaUnit(unit.value)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  selected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "bg-background hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    {unit.label}
                  </p>

                  {selected && (
                    <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      Selected
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
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