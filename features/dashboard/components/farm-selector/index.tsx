"use client";

import { ChevronDown, MapPin } from "lucide-react";

interface FarmSelectorProps {
  farms: DashboardFarm[];
  selectedFarmId: string;
  onFarmChange: (farmId: string) => void;
}

export function FarmSelector({
    farms,
  selectedFarmId,
  onFarmChange,
}: FarmSelectorProps) {
  const selectedFarm =
    farms.find((farm) => farm.id === selectedFarmId) ??
    farms[0];

  return (
    <div className="relative w-full sm:w-auto sm:min-w-60">
      <label
        htmlFor="farm-selector"
        className="sr-only"
      >
        Select farm
      </label>

      <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-xl bg-primary/10 p-2">
        <MapPin className="h-4 w-4 text-primary" />
      </div>

      <select
        id="farm-selector"
        value={selectedFarm.id}
        onChange={(event) => onFarmChange(event.target.value)}
        className="w-full appearance-none rounded-2xl border bg-card py-3 pl-14 pr-10 text-left text-sm font-medium shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {farms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.name} — {farm.location}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}