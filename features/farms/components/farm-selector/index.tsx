"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  MapPin,
  TreePine,
  Wheat,
} from "lucide-react";

import type { FarmSelectorProps } from "@/features/farms/types/farms";

export function FarmSelector({
  farms,
  selectedFarmId,
  onFarmChange,
}: FarmSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const selectedFarm =
    farms.find((farm) => farm.id === selectedFarmId) ?? farms[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!selectedFarm) {
    return null;
  }

  const isGarden = selectedFarm.type === "garden";

  return (
    <div
      ref={selectorRef}
      className="relative w-full sm:min-w-64 sm:max-w-72"
    >
      {/* Selected Farm */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-card px-3.5 py-3 text-left shadow-sm transition-all duration-200 ${
          open
            ? "border-primary/50 ring-2 ring-primary/15"
            : "hover:border-primary/30 hover:shadow-md"
        }`}
      >
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isGarden
              ? "bg-gold/15 text-gold"
              : "bg-primary/10 text-primary"
          }`}
        >
          {isGarden ? (
            <TreePine className="h-5 w-5" />
          ) : (
            <Wheat className="h-5 w-5" />
          )}
        </div>

        {/* Farm Info */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Active farm
          </p>

          <p className="mt-0.5 truncate text-sm font-semibold">
            {selectedFarm.name}
          </p>

          <div className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />

            <span className="truncate">
              {selectedFarm.location}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Select farm"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl"
        >
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Your farms & gardens
            </p>
          </div>

          <div className="space-y-1">
            {farms.map((farm) => {
              const selected = farm.id === selectedFarm.id;
              const farmIsGarden = farm.type === "garden";

              return (
                <button
                  key={farm.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onFarmChange(farm.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all duration-150 ${
                    selected
                      ? "bg-primary/8"
                      : "hover:bg-muted/70"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      farmIsGarden
                        ? "bg-gold/15 text-gold"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {farmIsGarden ? (
                      <TreePine className="h-4 w-4" />
                    ) : (
                      <Wheat className="h-4 w-4" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {farm.name}
                      </p>

                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                        {farm.type}
                      </span>
                    </div>

                    <div className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />

                      <span className="truncate">
                        {farm.location}
                      </span>
                    </div>
                  </div>

                  {/* Selected */}
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