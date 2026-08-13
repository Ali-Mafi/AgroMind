"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { FARMS } from "@/features/farms/constants/farms";

interface FarmContextValue {
  selectedFarmId: string;
  setSelectedFarmId: (farmId: string) => void;
}

const FarmContext = createContext<FarmContextValue | undefined>(
  undefined,
);

export function FarmProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedFarmId, setSelectedFarmId] = useState(
    FARMS[0]?.id ?? "",
  );

  const value = useMemo(
    () => ({
      selectedFarmId,
      setSelectedFarmId,
    }),
    [selectedFarmId],
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