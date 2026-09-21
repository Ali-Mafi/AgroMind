"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useFarm } from "../context/farm-context";

// URL context is presentation state; existing cloud data and mutations stay owned by useFarm.
export function useWorkspaceFarm() {
  const context = useFarm();
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("farm") ?? context.selectedFarmId;
  const farm = context.farms.find(f => f.id === id) ?? context.farms[0];
  function selectFarm(farmId: string) {
    if (!context.farms.some(f => f.id === farmId)) return;
    context.setSelectedFarmId(farmId);
    const query = new URLSearchParams(params.toString());
    query.set("farm", farmId);
    router.replace(`${window.location.pathname}?${query}`, { scroll: false });
  }
  return { ...context, farm, selectFarm };
}
