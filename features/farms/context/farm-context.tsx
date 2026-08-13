"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { FARMS } from "@/features/farms/constants/farms";
import { IRRIGATION_SCHEDULE_BY_FARM } from "@/features/irrigation/constants/irrigation";

import type { IrrigationSchedule } from "@/features/irrigation/types/irrigation";

interface FarmContextValue {
  selectedFarmId: string;
  setSelectedFarmId: (farmId: string) => void;

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
  const [selectedFarmId, setSelectedFarmId] = useState(
    FARMS[0]?.id ?? "",
  );

  const [irrigationSchedules, setIrrigationSchedules] =
    useState<
      Record<string, IrrigationSchedule | undefined>
    >(IRRIGATION_SCHEDULE_BY_FARM);

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
      selectedFarmId,
      setSelectedFarmId,
      irrigationSchedules,
      setIrrigationSchedule,
    }),
    [selectedFarmId, irrigationSchedules],
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