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

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8 lg:pt-10">
      {/* Header */}
      <header className="space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
              Irrigation
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Irrigation Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Monitor and manage irrigation for your farm.
            </p>
          </div>

          <div className="w-full lg:w-auto lg:min-w-64">
            <FarmSelector
              farms={FARMS}
              selectedFarmId={selectedFarm.id}
              onFarmChange={setSelectedFarmId}
            />
          </div>
        </div>
      </header>

      {/* Irrigation Overview */}
      <section aria-label="Irrigation overview">
        <IrrigationOverview irrigation={irrigation} />
      </section>

      {/* Control + Schedule */}
      <section
        aria-label="Irrigation controls and schedule"
        className="grid gap-5 lg:grid-cols-2"
      >
        <IrrigationControl
          farmName={selectedFarm.name}
        />

        <IrrigationSchedule
          farmId={selectedFarm.id}
          farmName={selectedFarm.name}
          schedule={schedule}
          onSave={(newSchedule) => {
            setIrrigationSchedule(
              selectedFarm.id,
              newSchedule,
            );
          }}
        />
      </section>

      {/* Sensors */}
      <section aria-label="Sensor status">
        <SensorStatus
          sensors={sensors}
          farmName={selectedFarm.name}
        />
      </section>
    </main>
  );
}