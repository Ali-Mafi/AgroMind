import { FarmSelector } from "@/features/farms/components/farm-selector";
import type { Farm } from "@/features/farms/constants/farms";


export function DashboardHeader({
  farms,
  selectedFarmId,
  onFarmChange,
}: {
  farms: Farm[];
  selectedFarmId: string;
  onFarmChange: (farmId: string) => void;
}) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
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