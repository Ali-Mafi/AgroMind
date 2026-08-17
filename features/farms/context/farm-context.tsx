"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { FARMS } from "@/features/farms/constants/farms";
import type { Farm } from "@/features/farms/types/farms";
import { IRRIGATION_SCHEDULE_BY_FARM } from "@/features/irrigation/constants/irrigation";

import type { IrrigationSchedule } from "@/features/irrigation/types/irrigation";

interface FarmContextValue {
  farms: Farm[];

  selectedFarmId: string;
  setSelectedFarmId: (farmId: string) => void;

  addFarm: (farm: Farm) => void;
  updateFarm: (farmId: string, updates: Partial<Farm>) => void;
  deleteFarm: (farmId: string) => void;

  irrigationSchedules: Record<
    string,
    IrrigationSchedule | undefined
  >;

  setIrrigationSchedule: (
    farmId: string,
    schedule: IrrigationSchedule,
  ) => void;
}

const FarmContext = createContext<
  FarmContextValue | undefined
>(undefined);

export function FarmProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [farms, setFarms] = useState<Farm[]>(FARMS);

  const [selectedFarmId, setSelectedFarmId] = useState(
    FARMS[0]?.id ?? "",
  );

  const [irrigationSchedules, setIrrigationSchedules] =
    useState<
      Record<string, IrrigationSchedule | undefined>
    >(IRRIGATION_SCHEDULE_BY_FARM);

  function addFarm(farm: Farm) {
    setFarms((current) => [...current, farm]);
    setSelectedFarmId(farm.id);
  }

  function updateFarm(
    farmId: string,
    updates: Partial<Farm>,
  ) {
    setFarms((current) =>
      current.map((farm) =>
        farm.id === farmId
          ? { ...farm, ...updates }
          : farm,
      ),
    );
  }

  function deleteFarm(farmId: string) {
    setFarms((current) =>
      current.filter((farm) => farm.id !== farmId),
    );

    setIrrigationSchedules((current) => {
      const next = { ...current };
      delete next[farmId];
      return next;
    });

    if (selectedFarmId === farmId) {
      setSelectedFarmId((current) => {
        const remaining = farms.filter(
          (farm) => farm.id !== current,
        );
        return remaining[0]?.id ?? "";
      });
    }
  }

  function setIrrigationSchedule(
    farmId: string,
    schedule: IrrigationSchedule,
  ) {
    setIrrigationSchedules((current) => ({
      ...current,
      [farmId]: schedule,
    }));
  }

  const value = useMemo(
    () => ({
      farms,
      selectedFarmId,
      setSelectedFarmId,
      addFarm,
      updateFarm,
      deleteFarm,
      irrigationSchedules,
      setIrrigationSchedule,
    }),
    [farms, selectedFarmId, irrigationSchedules],
  );

  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);

  if (!context) {
    throw new Error(
      "useFarm must be used inside FarmProvider",
    );
  }

  return context;
}
