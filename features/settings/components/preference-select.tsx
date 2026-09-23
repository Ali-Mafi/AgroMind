"use client";
import { useId, type ReactNode } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { useSettings } from "../context/settings-context";

export function PreferenceSelect<V extends string>({
  label,
  value,
  options,
  onChange,
  description,
  disabled = false,
  hideLabel = false,
  placeholder,
  id: suppliedId,
}: {
  label: string;
  value: V | "";
  options: readonly {
    value: V;
    label: string;
    description?: string;
    icon?: ReactNode;
  }[];
  onChange: (value: V) => void;
  description?: string;
  disabled?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  id?: string;
}) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const { direction } = useSettings();
  const selected = options.find((option) => option.value === value);
  return (
    <div className="min-w-0 space-y-2">
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={hideLabel ? "sr-only" : "block text-sm font-semibold"}
      >
        {label}
      </label>
      <Select.Root
        disabled={disabled}
        value={value || null}
        items={options}
        onValueChange={(next) => {
          if (next !== null) onChange(next as V);
        }}
      >
        <Select.Trigger
          id={id}
          aria-labelledby={`${id}-label`}
          aria-describedby={description ? `${id}-help` : undefined}
          className="app-select-trigger app-control flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-start text-base outline-none hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 sm:text-sm"
        >
          {selected?.icon && (
            <span className="app-icon-container shrink-0" aria-hidden="true">
              {selected.icon}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <Select.Value placeholder={placeholder} />
            {selected?.description && (
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {selected.description}
              </span>
            )}
          </span>
          <Select.Icon data-slot="select-icon">
            <ChevronDown size={16} aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            sideOffset={6}
            align="start"
            alignItemWithTrigger={false}
            collisionPadding={12}
            className="z-[110] max-w-[calc(100vw-1.5rem)] outline-none"
          >
            <Select.Popup
              dir={direction}
              className="agromind-surface app-popup max-h-[min(22rem,var(--available-height))] w-[var(--anchor-width)] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none"
            >
              <Select.List>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="app-control flex min-h-11 cursor-default items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm outline-none data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[selected]:bg-primary/5 data-[selected]:font-semibold"
                  >
                    {option.icon && (
                      <span
                        className="app-icon-container shrink-0"
                        aria-hidden="true"
                      >
                        {option.icon}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 break-words">
                      <Select.ItemText>{option.label}</Select.ItemText>
                      {option.description && (
                        <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </span>
                    <span className="size-4 shrink-0">
                      <Select.ItemIndicator>
                        <Check
                          size={16}
                          className="text-primary"
                          aria-hidden="true"
                        />
                      </Select.ItemIndicator>
                    </span>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      {description && (
        <p
          id={`${id}-help`}
          className="text-xs leading-5 text-muted-foreground"
        >
          {description}
        </p>
      )}
    </div>
  );
}
