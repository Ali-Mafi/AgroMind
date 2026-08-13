"use client";


import { FarmSelector } from "@/features/farms/components/farm-selector";
import { FARMS } from "@/features/farms/constants/farms";
import { useFarm } from "@/features/farms/context/farm-context";

import {
  IRRIGATION_OVERVIEW_BY_FARM,
  IRRIGATION_SENSORS_BY_FARM,
} from "@/features/irrigation/constants/irrigation";

import { IrrigationOverview } from "@/features/irrigation/components/irrigation-overview";
import { IrrigationControl } from "@/features/irrigation/components/irrigation-control";
import { IrrigationSchedule } from "@/features/irrigation/components/irrigation-schedule";
import { SensorStatus } from "@/features/irrigation/components/sensor-status";


export default function IrrigationPage() {

  const {
  selectedFarmId,
  setSelectedFarmId,
  irrigationSchedules,
  setIrrigationSchedule,
  } = useFarm();

  const selectedFarm =
    FARMS.find((farm) => farm.id === selectedFarmId) ?? FARMS[0];

  if (!selectedFarm) {
    return null;
  }

  const sensors =
    IRRIGATION_SENSORS_BY_FARM[selectedFarm.id] ?? [];
  
  const irrigation =
    IRRIGATION_OVERVIEW_BY_FARM[selectedFarm.id];

  const schedule =
  irrigationSchedules[selectedFarm.id];
    

  if (!irrigation) {
    return null;
  }

  console.log(
  "SELECTED FARM:",
  selectedFarm.id,
  "SCHEDULE:",
  irrigationSchedules[selectedFarm.id],
);

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Irrigation
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Irrigation Management
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Monitor and manage irrigation for your farm.
          </p>
        </div>

      <FarmSelector
          farms={FARMS}
          selectedFarmId={selectedFarm.id}
          onFarmChange={setSelectedFarmId}
        />
      </header>

      <IrrigationOverview
        irrigation={irrigation}
      />

      <IrrigationControl
        farmName={selectedFarm.name}
      />

      <IrrigationSchedule
        // key={selectedFarm.id}
        farmId={selectedFarm.id}
        farmName={selectedFarm.name}
        initialSchedule={schedule}
        onSave={(newSchedule) => {
          setIrrigationSchedule(
            selectedFarm.id,
            newSchedule,
          );
        }}
      />

      <SensorStatus
        sensors={sensors}
        farmName={selectedFarm.name}
      />
    </main>
  );
}