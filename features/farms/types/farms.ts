export interface FarmSelectorProps {
  farms: import("@/features/farms/constants/farms").Farm[];
  selectedFarmId: string;
  onFarmChange: (farmId: string) => void;
}