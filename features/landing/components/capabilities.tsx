import { Section } from "@/components/layout/section";

import {
  BrainCircuit,
  CloudSun,
  Droplets,
  MapPinned,
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: BrainCircuit,
    title: "AI Powered",
  },
  {
    icon: CloudSun,
    title: "Weather Intelligence",
  },
  {
    icon: Droplets,
    title: "Smart Irrigation",
  },
  {
    icon: MapPinned,
    title: "GPS Farm Management",
  },
];

export function Capabilities() {
  return (
    <Section variant="muted">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CAPABILITIES.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card p-6 text-center transition hover:shadow-md"
            >
              <Icon className="mx-auto mb-3 h-8 w-8 text-green-600" />

              <p className="text-sm font-medium">
                {item.title}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}