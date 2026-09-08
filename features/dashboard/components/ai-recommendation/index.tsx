import {
  BrainCircuit,
  Sparkles,
} from "lucide-react";

interface AIRecommendationProps {
  farmName: string;
}

export function AIRecommendation({
  farmName,
}: AIRecommendationProps) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BrainCircuit className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                AgroMind AI
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight">
                AI Insights
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Intelligent recommendations for{" "}
                <span className="font-medium text-foreground">
                  {farmName}
                </span>{" "}
                will appear here when the AgroMind AI engine is
                connected.
              </p>
            </div>
          </div>

          <span className="w-fit shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            Not connected
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed bg-muted/20 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <p className="text-sm font-semibold">
                AI analysis is not available yet
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Future insights will combine farm information,
                irrigation activity, sensor readings, weather data,
                and crop conditions before giving recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}