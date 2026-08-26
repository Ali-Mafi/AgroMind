"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
} from "lucide-react";

interface TimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

function parseTime(value: string) {
  const [hourValue, minuteValue] =
    value.split(":").map(Number);

  return {
    hour:
      Number.isInteger(hourValue) &&
      hourValue >= 0 &&
      hourValue <= 23
        ? hourValue
        : 6,

    minute:
      Number.isInteger(minuteValue) &&
      minuteValue >= 0 &&
      minuteValue <= 59
        ? minuteValue
        : 0,
  };
}

function formatTime(
  hour: number,
  minute: number,
) {
  return `${String(hour).padStart(
    2,
    "0",
  )}:${String(minute).padStart(2, "0")}`;
}

export function TimePicker({
  id,
  value,
  onChange,
}: TimePickerProps) {
  const wrapperRef =
    useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] =
    useState(false);

  const parsedTime = parseTime(value);

  const [hour, setHour] = useState(
    parsedTime.hour,
  );

  const [minute, setMinute] = useState(
    parsedTime.minute,
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

  function openPicker() {
    if (!isOpen && value) {
      const parsed = parseTime(value);

      setHour(parsed.hour);
      setMinute(parsed.minute);
    }

    setIsOpen((current) => !current);
  }

  function increaseHour() {
    setHour((current) =>
      current === 23 ? 0 : current + 1,
    );
  }

  function decreaseHour() {
    setHour((current) =>
      current === 0 ? 23 : current - 1,
    );
  }

  function increaseMinute() {
    setMinute((current) =>
      current === 59 ? 0 : current + 1,
    );
  }

  function decreaseMinute() {
    setMinute((current) =>
      current === 0 ? 59 : current - 1,
    );
  }

  function useCurrentTime() {
    const now = new Date();

    setHour(now.getHours());
    setMinute(now.getMinutes());
  }

  function handleDone() {
    onChange(
      formatTime(hour, minute),
    );

    setIsOpen(false);
  }

  return (
    <div
      ref={wrapperRef}
      className="relative mt-3"
    >
      <button
        id={id}
        type="button"
        onClick={openPicker}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left outline-none transition-all hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <Clock3 className="h-4 w-4 shrink-0 text-primary" />

        <span
          className={`min-w-0 flex-1 text-sm ${
            value
              ? "font-semibold text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {value || "Select a time"}
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
          aria-label="Choose irrigation time"
          className="absolute left-0 top-full z-50 mt-2 w-full min-w-72.5 rounded-2xl border bg-popover p-4 text-popover-foreground shadow-xl"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Start Time
            </p>

            <h3 className="mt-1 text-base font-bold">
              Choose irrigation time
            </h3>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            {/* Hour */}
            <div className="rounded-2xl border bg-background p-3">
              <p className="text-center text-xs font-medium text-muted-foreground">
                Hour
              </p>

              <button
                type="button"
                onClick={increaseHour}
                aria-label="Increase hour"
                className="mx-auto mt-2 flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
              >
                <ChevronUp className="h-4 w-4" />
              </button>

              <div className="my-1 flex h-14 items-center justify-center rounded-xl bg-primary/5">
                <span className="text-3xl font-bold tabular-nums text-primary">
                  {String(hour).padStart(
                    2,
                    "0",
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={decreaseHour}
                aria-label="Decrease hour"
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <span className="text-2xl font-bold text-muted-foreground">
              :
            </span>

            {/* Minute */}
            <div className="rounded-2xl border bg-background p-3">
              <p className="text-center text-xs font-medium text-muted-foreground">
                Minute
              </p>

              <button
                type="button"
                onClick={increaseMinute}
                aria-label="Increase minute"
                className="mx-auto mt-2 flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
              >
                <ChevronUp className="h-4 w-4" />
              </button>

              <div className="my-1 flex h-14 items-center justify-center rounded-xl bg-primary/5">
                <span className="text-3xl font-bold tabular-nums text-primary">
                  {String(minute).padStart(
                    2,
                    "0",
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={decreaseMinute}
                aria-label="Decrease minute"
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={useCurrentTime}
            className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <Clock3 className="h-4 w-4 text-primary" />
            Use current time
          </button>

          <button
            type="button"
            onClick={handleDone}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
          >
            <Check className="h-4 w-4" />
            Done
          </button>
        </div>
      )}
    </div>
  );
}