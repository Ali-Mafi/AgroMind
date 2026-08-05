import { CheckCircle2 } from "lucide-react";
import { Section } from "@/components/layout/section";

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

        <div className="flex items-center justify-center">
          <div className="flex h-105 w-full items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
            Dashboard Preview
          </div>
        </div>
      </div>
    </Section>
  );
}