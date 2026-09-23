"use client";
import { CircleEllipsis, CloudRain, Droplets, Waves } from "lucide-react";
import { PreferenceSelect } from "@/features/settings/components/preference-select";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  IRRIGATION_TYPES,
  type IrrigationType,
} from "@/features/farms/constants/irrigation-types";

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
}: {
  value: IrrigationType | "";
  onChange: (value: IrrigationType) => void;
  disabled?: boolean;
}) {
  const t = useTranslation();
  return (
    <PreferenceSelect<IrrigationType>
      hideLabel
      label={t("Irrigation Type")}
      placeholder={t("Select irrigation type")}
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={IRRIGATION_TYPES.map((type) => {
        const { icon: Icon, description } = IRRIGATION_META[type.value];
        return {
          value: type.value,
          label: t(type.label),
          description: t(description),
          icon: <Icon size={20} />,
        };
      })}
    />
  );
}
