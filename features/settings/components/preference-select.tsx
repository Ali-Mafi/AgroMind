"use client";
import { useId } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

export function PreferenceSelect<V extends string>({ label, value, options, onChange, description }: {
  label: string; value: V; options: readonly { value: V; label: string }[]; onChange: (value: V) => void; description?: string;
}) {
  const id = useId();
  return <div className="space-y-2">
    <label id={`${id}-label`} htmlFor={id} className="block text-sm font-semibold">{label}</label>
    <Select.Root value={value} items={options} onValueChange={(next) => { if (next !== null) onChange(next); }}>
      <Select.Trigger id={id} aria-labelledby={`${id}-label`} aria-describedby={description ? `${id}-help` : undefined} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-start text-sm outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary">
        <Select.Value /><Select.Icon><ChevronDown size={16} /></Select.Icon>
      </Select.Trigger>
      <Select.Portal><Select.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-[110] outline-none">
        <Select.Popup className="max-h-[min(22rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none">
          <Select.List>{options.map((option) => <Select.Item key={option.value} value={option.value} className="flex min-h-11 cursor-default items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-primary/10 data-[selected]:font-semibold">
            <Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator><Check size={16} className="text-primary" /></Select.ItemIndicator>
          </Select.Item>)}</Select.List>
        </Select.Popup>
      </Select.Positioner></Select.Portal>
    </Select.Root>
    {description && <p id={`${id}-help`} className="text-xs leading-5 text-muted-foreground">{description}</p>}
  </div>;
}
