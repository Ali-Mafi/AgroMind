import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { IrrigationWidget } from "@/features/dashboard/components/irrigation-widget";   
import { AIRecommendation } from "@/features/dashboard/components/ai-recommendation";


export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <DashboardHeader />

      <DashboardStats />

        <div className="grid gap-6 lg:grid-cols-2">
         
            <IrrigationWidget/>

            <AIRecommendation/>
          

        </div>

    </div>

  );
}