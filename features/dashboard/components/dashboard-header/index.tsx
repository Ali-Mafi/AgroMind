import { DashboardFarm } from "@/features/dashboard/types/dashboard";
import { FarmSelector } from "@/features/dashboard/components/farm-selector";

interface DashboardHeaderProps {
  farms: DashboardFarm[];
  selectedFarmId: string;
  onFarmChange: (farmId: string) => void;
}

export function DashboardHeader({
  farms,
  selectedFarmId,
  onFarmChange,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Farm Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Farm Overview
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Monitor your farm conditions and make smarter decisions.
        </p>
      </div>

      <FarmSelector
        farms={farms}
        selectedFarmId={selectedFarmId}
        onFarmChange={onFarmChange}
      />
    </header>
  );
}