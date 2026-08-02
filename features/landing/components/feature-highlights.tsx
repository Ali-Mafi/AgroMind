import {
  BrainCircuit,
  CloudSun,
  Droplets,
} from "lucide-react";

const FEATURES = [
  {
    icon: Droplets,
    title: "Smart Irrigation",
    description: "AI optimizes irrigation schedules for every farm.",
  },
  {
    icon: CloudSun,
    title: "Weather Intelligence",
    description: "Hyper-local weather forecasts based on farm location.",
  },
  {
    icon: BrainCircuit,
    title: "AI Crop Assistant",
    description: "Receive intelligent recommendations to improve yield.",
  },
];

export function FeatureHighlights() {
  return (
    <section className="py-16">
      <div className="grid gap-6 md:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <Icon className="mb-4 h-10 w-10 text-green-600" />

              <h3 className="text-lg font-semibold">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}