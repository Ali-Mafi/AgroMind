import { BrainCircuit } from "lucide-react";

import type { DashboardAI } from "@/features/dashboard/types/dashboard";

interface AIRecommendationProps {
  ai: DashboardAI;
}

export function AIRecommendation({
  ai,
}: AIRecommendationProps) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <BrainCircuit className="h-5 w-5 text-primary" />
        </div>

        <div>
          <h2 className="font-semibold">
            AI Recommendation
          </h2>

          <p className="text-sm text-muted-foreground">
            AgroMind analysis
          </p>
        </div>
      </div>

      <div className="mt-6">
        <span className="text-sm font-semibold text-primary">
          {ai.status}
        </span>

        <p className="mt-2 leading-6 text-muted-foreground">
          {ai.message}
        </p>
      </div>
    </div>
  );
}