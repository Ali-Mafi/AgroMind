"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DatePickerProps {
  id?: string;
  value: string;
  minDate?: string;
  onChange: (value: string) => void;
}

const WEEK_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isSameDay(
  first: Date,
  second: Date,
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function DatePicker({
  id,
  value,
  minDate,
  onChange,
}: DatePickerProps) {
  const wrapperRef =
    useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] =
    useState(false);

  const selectedDate = parseDate(value);
  const minimumDate = parseDate(minDate);

  const initialDate =
    selectedDate ??
    minimumDate ??
    new Date();

  const [viewDate, setViewDate] = useState(
    () =>
      new Date(
        initialDate.getFullYear(),
        initialDate.getMonth(),
        1,
      ),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(
      event: MouseEvent,
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen]);

  function openCalendar() {
    if (!isOpen) {
      const date =
        selectedDate ??
        minimumDate ??
        new Date();

      setViewDate(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          1,
        ),
      );
    }

    setIsOpen((current) => !current);
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel =
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(viewDate);

  const firstDayOfMonth = new Date(
    year,
    month,
    1,
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  const calendarCells: Array<
    number | null
  > = [];

  for (
    let index = 0;
    index < firstDayOfMonth;
    index += 1
  ) {
    calendarCells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day += 1
  ) {
    calendarCells.push(day);
  }

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const previousMonthEnd = new Date(
    year,
    month,
    0,
  );

  const canGoPrevious =
    !minimumDate ||
    previousMonthEnd >= minimumDate;

  function goToPreviousMonth() {
    if (!canGoPrevious) {
      return;
    }

    setViewDate(
      new Date(year, month - 1, 1),
    );
  }

  function goToNextMonth() {
    setViewDate(
      new Date(year, month + 1, 1),
    );
  }

  function selectDay(day: number) {
    const selected = new Date(
      year,
      month,
      day,
    );

    if (
      minimumDate &&
      selected < minimumDate
    ) {
      return;
    }

    onChange(formatDateValue(selected));
    setIsOpen(false);
  }

  const today = new Date();

  return (
    <div
      ref={wrapperRef}
      className="relative mt-3"
    >
      <button
        id={id}
        type="button"
        onClick={openCalendar}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left outline-none transition-all hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />

        <span
          className={`min-w-0 flex-1 truncate text-sm ${
            selectedDate
              ? "font-medium text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {selectedDate
            ? formatDisplayDate(selectedDate)
            : "Select a date"}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Choose irrigation date"
          className="absolute left-0 top-full z-50 mt-2 w-full min-w-70 rounded-2xl border bg-popover p-4 text-popover-foreground shadow-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goToPreviousMonth}
              disabled={!canGoPrevious}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <p className="text-sm font-bold tracking-tight">
              {monthLabel}
            </p>

            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background transition-colors hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {calendarCells.map(
              (day, index) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="h-9"
                    />
                  );
                }

                const date = new Date(
                  year,
                  month,
                  day,
                );

                const dateValue =
                  formatDateValue(date);

                const disabled =
                  Boolean(
                    minimumDate &&
                      date < minimumDate,
                  );

                const selected =
                  value === dateValue;

                const isToday =
                  isSameDay(date, today);

                return (
                  <button
                    key={dateValue}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      selectDay(day)
                    }
                    aria-pressed={selected}
                    aria-current={
                      isToday
                        ? "date"
                        : undefined
                    }
                    className={`flex h-9 items-center justify-center rounded-xl text-sm font-medium transition-all ${
                      selected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isToday
                          ? "border border-primary/30 bg-primary/5 text-primary"
                          : "hover:bg-muted"
                    } ${
                      disabled
                        ? "cursor-not-allowed text-muted-foreground/30 hover:bg-transparent"
                        : ""
                    }`}
                  >
                    {day}
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}