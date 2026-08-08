import {
  BrainCircuit,
  CheckCircle2,
  CloudSun,
  Droplets,
  Waves,
} from "lucide-react";import { Section } from "@/components/layout/section";

const FEATURES = [
  "Hyper-local Weather",
  "Smart Irrigation",
  "AI Crop Recommendations",
  "GPS Farm Management",
  "Sensor Monitoring",
  "Crop Planning",
];

export function ValueProposition() {
  return (
    <Section>
      <div className="grid items-center gap-16 lg:grid-cols-2">
        {/* Left Side */}

        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-green-600">
            Why AgroMind
          </span>

          <h2 className="mt-4 text-4xl font-bold tracking-tight">
            Everything your farm needs,
            <br />
            in one intelligent platform.
          </h2>

          <p className="mt-6 text-lg text-muted-foreground">
            AgroMind combines weather intelligence,
            irrigation management, AI recommendations,
            GPS mapping and crop planning into one
            powerful farming platform.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600" />

                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side */}

{/* Right Side */}

<div className="flex items-center justify-center">
  <div className="w-full rounded-3xl border bg-card p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">
          Dashboard
        </p>

        <h3 className="mt-1 text-lg font-semibold">
          Farm Overview
        </h3>
      </div>

      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        Live
      </span>
    </div>

    <div className="mt-6 grid grid-cols-2 gap-4">
      <div className="rounded-2xl border p-4">
        <CloudSun className="h-5 w-5 text-primary" />

        <p className="mt-3 text-sm text-muted-foreground">
          Weather
        </p>

        <p className="mt-1 text-2xl font-bold">
          27°C
        </p>
      </div>

      <div className="rounded-2xl border p-4">
        <Droplets className="h-5 w-5 text-primary" />

        <p className="mt-3 text-sm text-muted-foreground">
          Soil Moisture
        </p>

        <p className="mt-1 text-2xl font-bold">
          48%
        </p>
      </div>
    </div>

    <div className="mt-4 rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Irrigation
        </span>

        <span className="text-sm font-semibold text-primary">
          80%
        </span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-muted">
        <div className="h-2 w-4/5 rounded-full bg-primary" />
      </div>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="rounded-2xl border p-4">
        <BrainCircuit className="h-5 w-5 text-primary" />

        <p className="mt-3 text-sm text-muted-foreground">
          AI Status
        </p>

        <p className="mt-1 font-semibold text-primary">
          Optimal
        </p>
      </div>

      <div className="rounded-2xl border p-4">
        <Waves className="h-5 w-5 text-primary" />

        <p className="mt-3 text-sm text-muted-foreground">
          Water Tank
        </p>

        <p className="mt-1 text-2xl font-bold">
          82%
        </p>
      </div>
    </div>
  </div>
</div>
      </div>
    </Section>
  );
}