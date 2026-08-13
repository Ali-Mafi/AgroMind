"use client";

import { AIRecommendation } from "@/features/dashboard/components/ai-recommendation";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { IrrigationWidget } from "@/features/dashboard/components/irrigation-widget";
import { WeatherWidget } from "@/features/dashboard/components/weather-widget";
import { QuickActions } from "@/features/dashboard/components/quick-actions";

import { DASHBOARD_FARM_DATA } from "@/features/dashboard/constants/dashboard";
import { useFarm } from "@/features/farms/context/farm-context";
import { useRouter } from "next/navigation";

export function DashboardOverview() {
  const { selectedFarmId } = useFarm();
  const router = useRouter();

  const selectedFarmData =
    DASHBOARD_FARM_DATA.find(
      (farmData) => farmData.farm.id === selectedFarmId,
    ) ?? DASHBOARD_FARM_DATA[0];

  if (!selectedFarmData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <DashboardStats stats={selectedFarmData.stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeatherWidget
            weather={selectedFarmData.weather}
          />
        </div>

        <IrrigationWidget
          irrigation={selectedFarmData.irrigation}
        />
      </div>

      <AIRecommendation
        ai={selectedFarmData.ai}
      />

      <QuickActions
        onIrrigationClick={() => router.push("/irrigation")}
      />
      
    </div>
  );
}