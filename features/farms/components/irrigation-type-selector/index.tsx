"use client";

import { useTranslation } from "@/features/settings/hooks/use-translation";
import { T } from "@/features/settings/components/translated-text";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleEllipsis,
  CloudRain,
  Droplets,
  Waves,
} from "lucide-react";

import {
  IRRIGATION_TYPES,
  type IrrigationType,
} from "@/features/farms/constants/irrigation-types";

interface IrrigationTypeSelectorProps {
  value: IrrigationType | "";
  onChange: (value: IrrigationType) => void;
  disabled?: boolean;
}

const IRRIGATION_META: Record<
  IrrigationType,
  {
    description: string;
    icon: typeof Droplets;
  }
> = {
  flood: {
    description: "Water flows across the soil surface",
    icon: Waves,
  },

  drip: {
    description: "Water is delivered directly to plant roots",
    icon: Droplets,
  },

  sprinkler: {
    description: "Water is distributed through sprinklers",
    icon: CloudRain,
  },

  other: {
    description: "Another irrigation method",
    icon: CircleEllipsis,
  },
};

export function IrrigationTypeSelector({
  value,
  onChange,
  disabled = false,
}: IrrigationTypeSelectorProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);

  const selectorRef = useRef<HTMLDivElement>(null);

  const selectedType = IRRIGATION_TYPES.find(
    (type) => type.value === value,
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  const SelectedIcon = selectedType
    ? IRRIGATION_META[selectedType.value].icon
    : Droplets;

  return (
    <div
      ref={selectorRef}
      className="relative w-full"
    >
      {/* Selected irrigation type */}
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          setOpen((current) => !current)
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          group flex min-h-16 w-full items-center gap-3
          rounded-2xl border bg-background
          px-3.5 py-3 text-start
          shadow-sm
          transition-all duration-200
          disabled:cursor-not-allowed disabled:opacity-50
          ${
            open
              ? "border-primary/50 ring-2 ring-primary/15"
              : "hover:border-primary/30 hover:shadow-md"
          }
        `}
      >
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <SelectedIcon className="h-5 w-5" />
        </div>

        {/* Information */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"><T text="Irrigation method" /></p>

          <p
            className={`mt-0.5 truncate text-sm font-semibold ${
              selectedType
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {selectedType
              ? t(selectedType.label)
              : t("Select irrigation type")}
          </p>

          {selectedType && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {t(
                IRRIGATION_META[
                  selectedType.value
                ].description
              )}
            </p>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open
              ? "rotate-180 text-primary"
              : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && !disabled && (
        <div
          role="listbox"
          aria-label={t("Select irrigation type")}
          className="
            absolute left-0 right-0
            top-[calc(100%+8px)]
            z-50
            overflow-hidden
            rounded-2xl border
            bg-card p-1.5
            shadow-xl
          "
        >
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-muted-foreground"><T text="Irrigation types" /></p>
          </div>

          <div className="space-y-1">
            {IRRIGATION_TYPES.map((type) => {
              const selected =
                type.value === value;

              const meta =
                IRRIGATION_META[type.value];

              const Icon = meta.icon;

              return (
                <button
                  key={type.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(type.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-start transition-all duration-150 ${
                    selected
                      ? "bg-primary/8"
                      : "hover:bg-muted/70"
                  }`}
                >
                  {/* Option icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      selected
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Option content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      <T text={type.label} />
                    </p>

                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {t(meta.description)}
                    </p>
                  </div>

                  {/* Selected indicator */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {selected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
