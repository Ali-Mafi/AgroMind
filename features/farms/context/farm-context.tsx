"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { FARMS } from "@/features/farms/constants/farms";
import type { Farm } from "@/features/farms/types/farms";
import { IRRIGATION_SCHEDULE_BY_FARM } from "@/features/irrigation/constants/irrigation";
import type { IrrigationSchedule } from "@/features/irrigation/types/irrigation";

const FARMS_STORAGE_KEY = "agromind-farms";
const IRRIGATION_STORAGE_KEY = "agromind-irrigation-schedules";

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

const FarmContext = createContext<FarmContextValue | undefined>(
  undefined,
);

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
    useState<Record<string, IrrigationSchedule | undefined>>(
      IRRIGATION_SCHEDULE_BY_FARM,
    );

  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved data from localStorage once on the client.
  useEffect(() => {
    try {
      const storedFarms = localStorage.getItem(FARMS_STORAGE_KEY);

      if (storedFarms) {
        const parsedFarms = JSON.parse(storedFarms) as Farm[];

        if (Array.isArray(parsedFarms)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFarms(parsedFarms);

          setSelectedFarmId((current) => {
            if (
              current &&
              parsedFarms.some((farm) => farm.id === current)
            ) {
              return current;
            }

            return parsedFarms[0]?.id ?? "";
          });
        }
      }

      const storedSchedules = localStorage.getItem(
        IRRIGATION_STORAGE_KEY,
      );

      if (storedSchedules) {
        const parsedSchedules = JSON.parse(
          storedSchedules,
        ) as Record<string, IrrigationSchedule | undefined>;

        if (
          parsedSchedules &&
          typeof parsedSchedules === "object"
        ) {
          setIrrigationSchedules(parsedSchedules);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load AgroMind data from localStorage:",
        error,
      );
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist farms only after localStorage hydration has completed.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      localStorage.setItem(
        FARMS_STORAGE_KEY,
        JSON.stringify(farms),
      );
    } catch (error) {
      console.error(
        "Failed to save farms to localStorage:",
        error,
      );
    }
  }, [farms, isHydrated]);

  // Persist irrigation schedules only after hydration has completed.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      localStorage.setItem(
        IRRIGATION_STORAGE_KEY,
        JSON.stringify(irrigationSchedules),
      );
    } catch (error) {
      console.error(
        "Failed to save irrigation schedules to localStorage:",
        error,
      );
    }
  }, [irrigationSchedules, isHydrated]);

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
    setFarms((current) => {
      const next = current.filter(
        (farm) => farm.id !== farmId,
      );

      if (selectedFarmId === farmId) {
        setSelectedFarmId(next[0]?.id ?? "");
      }

      return next;
    });

    setIrrigationSchedules((current) => {
      const next = { ...current };
      delete next[farmId];
      return next;
    });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
