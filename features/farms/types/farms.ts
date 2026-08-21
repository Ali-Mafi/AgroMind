export interface FarmSelectorProps {
  farms: Farm[];
  selectedFarmId: string;
  onFarmChange: (farmId: string) => void;
}

export type FarmType = "farm" | "garden";

export interface FarmCrop {
  id: string;
  name: string;
}

export interface GardenPlant {
  id: string;
  name: string;
  quantity: number;
  spacing: number;
  age: number;
}

export interface FarmLocation {
  latitude: number;
  longitude: number;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  coordinates?: FarmLocation;
  area: number;
  type: FarmType;

  crop?: FarmCrop;
  irrigationType?: string;

  plants?: GardenPlant[];
}