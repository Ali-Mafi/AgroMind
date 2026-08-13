"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AreaUnit = "sqm" | "hectare";

interface SettingsContextValue {
  areaUnit: AreaUnit;
  setAreaUnit: (unit: AreaUnit) => void;
}

const SettingsContext = createContext<
  SettingsContextValue | undefined
>(undefined);

export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sqm");

  const value = useMemo(
    () => ({
      areaUnit,
      setAreaUnit,
    }),
    [areaUnit],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used inside SettingsProvider",
    );
  }

  return context;
}