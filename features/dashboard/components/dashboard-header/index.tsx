import { FarmSelector } from "@/features/farms/components/farm-selector";
import { useFarm } from "@/features/farms/context/farm-context";

export function DashboardHeader() {
  const {
  farms,
  selectedFarmId,
  setSelectedFarmId,
} = useFarm();

  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <span className="text-sm font-semibold uppercase tracking-widest text-green-600">
          Farm Dashboard
        </span>

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
        onFarmChange={setSelectedFarmId}
      />
      
    </header>
  );
}