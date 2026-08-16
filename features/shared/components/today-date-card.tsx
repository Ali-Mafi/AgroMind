"use client";

import { CalendarDays } from "lucide-react";

import { useRegion } from "@/features/region/context/region-context";
import {
  formatRegionalDate,
  formatRegionalShortDate,
} from "@/lib/date-format";

export function TodayDateCard() {
  const { region } = useRegion();

  const today = new Date();

  const regionalDate = formatRegionalDate(today, region);
  const shortRegionalDate = formatRegionalShortDate(today, region);

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
          <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Today
          </p>

          <p className="mt-1 text-base font-bold tracking-tight sm:text-lg">
            {regionalDate}
          </p>

          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {shortRegionalDate}
          </p>
        </div>
      </div>
    </section>
  );
}