"use client";
import { Sprout, Trees } from "lucide-react";
import { PreferenceSelect } from "@/features/settings/components/preference-select";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import type { FarmSelectorProps } from "../types/farms";

export function FarmSwitcher({
  farms,
  selectedFarmId,
  onFarmChange,
  compact = false,
}: FarmSelectorProps & { compact?: boolean }) {
  const t = useTranslation();
  if (!farms.length) return null;

  return (
    <div
      className={compact ? "w-auto min-w-0" : "w-full sm:w-72"}
      data-farm-switcher={compact ? "compact" : "default"}
    >
      <PreferenceSelect
        label={t("Active farm")}
        hideLabel={compact}
        value={selectedFarmId || farms[0].id}
        options={farms.map((farm) => ({
          value: farm.id,
          label: farm.name,
          icon:
            farm.type === "garden" ? (
              <Trees size={17} />
            ) : (
              <Sprout size={17} />
            ),
        }))}
        onChange={onFarmChange}
      />
    </div>
  );
}
