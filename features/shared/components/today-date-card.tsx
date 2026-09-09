"use client";

import { T } from "@/features/settings/components/translated-text";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { useSettings } from "@/features/settings/context/settings-context";


export function TodayDateCard() {
  const { format, language } = useSettings();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
            <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary"><T text="Today" /></p>

            <div className="mt-2 h-5 w-48 animate-pulse rounded-md bg-muted" />

            <div className="mt-2 h-4 w-32 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </section>
    );
  }

  const today = new Date();

  const regionalDate = format.date(today, { weekday: "long", month: "long" });



  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
          <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary"><T text="Today" /></p>

          <p
            className={`mt-1 text-base font-bold tracking-tight sm:text-lg ${
              language === "fa" ? "font-vazirmatn" : ""
            }`}
          >
            {regionalDate}
          </p>


        </div>
      </div>
    </section>
  );
}
