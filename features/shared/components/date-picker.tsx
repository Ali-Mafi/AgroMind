"use client";
import { useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { calendarMonth, firstWeekday, localDateValue, parseLocalDate, shiftDay } from "@/features/settings/lib/calendar";

interface DatePickerProps { id?: string; value: string; minDate?: string; onChange: (value: string) => void }
export function DatePicker({ id, value, minDate, onChange }: DatePickerProps) {
  const { calendar, country, format, direction } = useSettings();
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = parseLocalDate(value);
  const minimum = parseLocalDate(minDate);
  const [anchor, setAnchor] = useState(() => selected ?? minimum ?? new Date());
  const month = useMemo(() => calendarMonth(anchor, calendar), [anchor, calendar]);
  const weekStart = firstWeekday(country);
  const blanks = (month.first.getDay() - weekStart + 7) % 7;
  const weekDays = Array.from({ length: 7 }, (_, index) => new Date(2026, 0, 4 + (weekStart + index) % 7, 12));
  const label = (date: Date) => format.date(date, { year: "numeric", month: "long", day: "numeric" });
  const today = localDateValue(new Date());
  return <Popover.Root open={open} onOpenChange={(next) => { if (next) setAnchor(selected ?? minimum ?? new Date()); setOpen(next); }}>
    <Popover.Trigger id={id} className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-start outline-none hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary">
      <CalendarDays size={16} className="text-primary" /><span className="flex-1 text-sm">{selected ? label(selected) : t("Select a date")}</span><ChevronDown size={16} />
    </Popover.Trigger>
    <Popover.Portal><Popover.Positioner sideOffset={8} align="start" className="z-[80]">
      <Popover.Popup aria-label={t("Choose irrigation date")} className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl border bg-popover p-4 text-popover-foreground shadow-xl outline-none" dir={direction}>
        <div className="flex items-center justify-between gap-3">
          <button type="button" disabled={!!minimum && month.previous < minimum} onClick={() => setAnchor(month.previous)} aria-label={t("Previous month")} className="rounded-xl border p-2 disabled:opacity-30"><ChevronLeft size={18} className="rtl:rotate-180" /></button>
          <p className="text-sm font-bold" aria-live="polite">{format.date(month.first, { year: "numeric", month: "long", day: undefined })}</p>
          <button type="button" onClick={() => setAnchor(month.next)} aria-label={t("Next month")} className="rounded-xl border p-2"><ChevronRight size={18} className="rtl:rotate-180" /></button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => <span key={index} className="py-2 text-center text-xs text-muted-foreground">{format.date(day, { year: undefined, month: undefined, day: undefined, weekday: "short" })}</span>)}
          {Array.from({ length: blanks }, (_, index) => <span key={`blank-${index}`} />)}
          {month.days.map((date) => {
            const key = localDateValue(date);
            return <button type="button" key={key} data-date={key} disabled={!!minimum && date < minimum}
              aria-label={label(date)} aria-pressed={key === value} aria-current={key === today ? "date" : undefined}
              onClick={() => { onChange(key); setOpen(false); }}
              onKeyDown={(event) => {
                const delta = event.key === "ArrowDown" ? 7 : event.key === "ArrowUp" ? -7 : event.key === "ArrowRight" ? (direction === "rtl" ? -1 : 1) : event.key === "ArrowLeft" ? (direction === "rtl" ? 1 : -1) : 0;
                if (!delta) return;
                event.preventDefault();
                const target = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-date="${localDateValue(shiftDay(date, delta))}"]`);
                target?.focus();
              }}
              className={`flex h-10 items-center justify-center rounded-xl text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-25 ${key === value ? "bg-primary text-primary-foreground" : key === today ? "border border-primary/30 bg-primary/5 text-primary" : "hover:bg-muted"}`}>
              {format.date(date, { year: undefined, month: undefined, day: "numeric" })}
            </button>;
          })}
        </div>
      </Popover.Popup>
    </Popover.Positioner></Popover.Portal>
  </Popover.Root>;
}
