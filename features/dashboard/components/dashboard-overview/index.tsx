"use client";

import { useState } from "react";

import { AIRecommendation } from "@/features/dashboard/components/ai-recommendation";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { IrrigationWidget } from "@/features/dashboard/components/irrigation-widget";
import { WeatherWidget } from "@/features/dashboard/components/weather-widget";
import { QuickActions } from "@/features/dashboard/components/quick-actions";

import {
  DASHBOARD_FARM_DATA,
  DASHBOARD_FARMS,
} from "@/features/dashboard/constants/dashboard";

export function DashboardOverview() {
  const [selectedFarmId, setSelectedFarmId] = useState(
    DASHBOARD_FARMS[0]?.id ?? "",
  );

  const selectedFarmData =
    DASHBOARD_FARM_DATA.find(
      (farmData) => farmData.farm.id === selectedFarmId,
    ) ?? DASHBOARD_FARM_DATA[0];

  if (!selectedFarmData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        farms={DASHBOARD_FARMS}
        selectedFarmId={selectedFarmId}
        onFarmChange={setSelectedFarmId}
      />

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

      <QuickActions />

      
    </div>
  );
}