import Link from "next/link";
import { Settings } from "lucide-react";
import { T } from "@/features/settings/components/translated-text";
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
        <span className="text-sm font-semibold uppercase tracking-widest text-primary"><T text="Farm Dashboard" /></span>

        <h1 className="mt-2 text-3xl font-bold tracking-tight"><T text="Farm Overview" /></h1>

        <p className="mt-2 text-sm text-muted-foreground"><T text="Monitor your farm conditions and make smarter decisions." /></p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
      <Link href="/settings" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-semibold hover:border-primary/40"><Settings size={16} /><T text="Settings" /></Link>
      <FarmSelector
        farms={farms}
        selectedFarmId={selectedFarmId}
        onFarmChange={setSelectedFarmId}
      />
      </div>
      
    </header>
  );
}
