"use client";

import { useState } from "react";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { IrrigationWidget } from "@/features/dashboard/components/irrigation-widget";   
import { AIRecommendation } from "@/features/dashboard/components/ai-recommendation";
import { DASHBOARD_FARMS } from "@/features/dashboard/constants/dashboard";


export function DashboardOverview() {
  const [selectedFarmId, setSelectedFarmId] = useState(
  DASHBOARD_FARMS[0]?.id ?? "",
);
  return (
    <div className="space-y-6">
      <DashboardHeader
  farms={DASHBOARD_FARMS}
  selectedFarmId={selectedFarmId}
  onFarmChange={setSelectedFarmId}
/>

      <DashboardStats />

        <div className="grid gap-6 lg:grid-cols-2">
         
            <IrrigationWidget/>

            <AIRecommendation/>
          

        </div>

    </div>

  );
}