import {
  Droplets,
  Thermometer,
  Waves,
} from "lucide-react";

import type { DashboardStat } from "@/features/dashboard/types/dashboard";

interface DashboardStatsProps {
  stats: DashboardStat[];
}

const STAT_ICONS = {
  "soil-moisture": Droplets,
  temperature: Thermometer,
  humidity: Droplets,
  "water-tank": Waves,
} as const;

export function DashboardStats({
  stats,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon =
          STAT_ICONS[stat.id as keyof typeof STAT_ICONS];

        return (
          <div
            key={stat.id}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>

              <span className="text-xs font-medium text-primary">
                {stat.status}
              </span>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              {stat.label}
            </p>

            <p className="mt-1 text-2xl font-bold">
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}