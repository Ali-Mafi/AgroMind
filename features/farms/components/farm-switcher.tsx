"use client";
import { PreferenceSelect } from "@/features/settings/components/preference-select";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import type { FarmSelectorProps } from "../types/farms";

export function FarmSwitcher({
  farms,
  selectedFarmId,
  onFarmChange,
}: FarmSelectorProps) {
  const t = useTranslation();
  if (!farms.length) return null;
  return (
    <div className="w-full sm:w-72">
      <PreferenceSelect
        label={t("Active farm")}
        value={selectedFarmId || farms[0].id}
        options={farms.map((f) => ({ value: f.id, label: f.name }))}
        onChange={onFarmChange}
      />
    </div>
  );
}
