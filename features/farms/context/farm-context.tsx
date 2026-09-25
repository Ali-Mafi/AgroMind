"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Farm } from "@/features/farms/types/farms";
import type { IrrigationSchedule } from "@/features/irrigation/types/irrigation";
import type {
  CloudResult,
  CloudSnapshot,
  FarmAccessRole,
  WorkspaceFarm,
} from "@/features/cloud/types";
import {
  createFarmAction,
  deleteFarmAction,
  deleteScheduleAction,
  loadCloudData,
  saveScheduleAction,
  updateFarmAction,
} from "@/features/cloud/services/actions";
import { can, getLimit } from "@/features/entitlements/lib/entitlements";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { Button } from "@/components/ui/button";

type FarmContextValue = {
  farms: WorkspaceFarm[];
  isHydrated: boolean;
  selectedFarmId: string;
  setSelectedFarmId: (id: string) => void;
  addFarm: (farm: Farm) => Promise<boolean>;
  updateFarm: (id: string, changes: Partial<Farm>) => Promise<boolean>;
  deleteFarm: (id: string) => Promise<boolean>;
  irrigationSchedules: Record<string, IrrigationSchedule | undefined>;
  setIrrigationSchedule: (id: string, schedule: IrrigationSchedule) => Promise<boolean>;
  deleteIrrigationSchedule: (id: string) => Promise<boolean>;
  cloud: CloudSnapshot;
  busy: boolean;
  error: string;
  farmLimit: number;
  canCreateFarm: boolean;
  farmRole: (id: string) => FarmAccessRole | undefined;
  canEditFarm: (id: string) => boolean;
  canDeleteFarm: (id: string) => boolean;
  canManageIrrigation: (id: string) => boolean;
  run: (operation: () => Promise<CloudResult<CloudSnapshot>>) => Promise<boolean>;
  reload: () => Promise<void>;
};

const FarmContext = createContext<FarmContextValue | undefined>(undefined);

export function FarmProvider({
  children,
  initialCloud,
}: {
  children: ReactNode;
  initialCloud: CloudSnapshot;
}) {
  const [cloud, setCloud] = useState(initialCloud);
  const [selectedFarmId, setSelectedFarmId] = useState(initialCloud.farms[0]?.id ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ended, setEnded] = useState(false);
  const revision = useRef(0);
  const pending = useRef(false);
  const t = useTranslation();
  const userId = initialCloud.user.id;

  const accessFor = useCallback(
    (id: string) => cloud.farms.find((farm) => farm.id === id)?.access,
    [cloud.farms],
  );

  const deny = useCallback(() => {
    setError("Your role does not allow this change.");
    return Promise.resolve(false);
  }, []);

  const apply = useCallback(
    (next: CloudSnapshot) => {
      if (next.user.id !== userId) {
        setEnded(true);
        window.location.replace("/sign-in");
        return;
      }
      setCloud(next);
      setSelectedFarmId((id) =>
        next.farms.some((farm) => farm.id === id) ? id : (next.farms[0]?.id ?? ""),
      );
    },
    [userId],
  );

  const reload = useCallback(async () => {
    if (pending.current) return;
    const current = ++revision.current;
    try {
      const result = await loadCloudData();
      if (current !== revision.current) return;
      if (result.ok) {
        apply(result.data);
        setError("");
      } else setError(result.error);
    } catch {
      setError("Your cloud data could not be loaded. Please try again.");
    }
  }, [apply]);

  const run = useCallback(
    async (operation: () => Promise<CloudResult<CloudSnapshot>>) => {
      if (pending.current) return false;
      pending.current = true;
      revision.current++;
      setBusy(true);
      setError("");
      try {
        const result = await operation();
        if (!result.ok) {
          setError(result.error);
          return false;
        }
        apply(result.data);
        return result.data.user.id === userId;
      } catch {
        setError("The change could not be saved. Check your connection and try again.");
        return false;
      } finally {
        pending.current = false;
        setBusy(false);
      }
    },
    [apply, userId],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    apply(initialCloud);
  }, [initialCloud, apply]);

  useEffect(() => {
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("agromind-account")
        : null;
    const onMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "signed-out" ||
        (event.data?.type === "account" && event.data.userId !== userId)
      ) {
        setEnded(true);
        revision.current++;
        window.location.replace("/sign-in");
      }
    };
    if (channel) {
      channel.onmessage = onMessage;
      channel.postMessage({ type: "account", userId });
    }
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    // Avoid a full cloud snapshot request on every app switch/visibility change.
    // Mutations already return fresh snapshots; reconnect and bfcache restore are
    // the only global reconciliation points needed here.
    window.addEventListener("online", reload);
    window.addEventListener("pageshow", restored);
    return () => {
      channel?.close();
      window.removeEventListener("online", reload);
      window.removeEventListener("pageshow", restored);
    };
  }, [reload, userId]);

  if (ended)
    return (
      <p role="status" className="p-6">
        {t("Returning to sign in…")}
      </p>
    );

  return (
    <FarmContext.Provider
      value={{
        farms: cloud.farms,
        isHydrated: true,
        selectedFarmId,
        setSelectedFarmId,
        cloud,
        busy,
        error,
        farmLimit: getLimit(cloud.entitlements, "farms"),
        canCreateFarm: can(
          { entitlements: cloud.entitlements, farmCount: cloud.account.farm_count },
          "farm:create",
        ),
        run,
        reload,
        farmRole: (id) => accessFor(id)?.role,
        canEditFarm: (id) => accessFor(id)?.canEditFarm ?? false,
        canDeleteFarm: (id) => accessFor(id)?.canDeleteFarm ?? false,
        canManageIrrigation: (id) =>
          accessFor(id)?.canManageIrrigation ?? false,
        addFarm: (farm) => run(() => createFarmAction(farm, userId)),
        updateFarm: (id, changes) => {
          const access = accessFor(id);
          if (!access?.canEditFarm) return deny();
          return run(() =>
            updateFarmAction(access.accountId, id, changes, userId),
          );
        },
        deleteFarm: (id) => {
          const access = accessFor(id);
          if (!access?.canDeleteFarm) return deny();
          return run(() => deleteFarmAction(access.accountId, id, userId));
        },
        irrigationSchedules: cloud.irrigationSchedules,
        setIrrigationSchedule: (id, schedule) => {
          const access = accessFor(id);
          if (!access?.canManageIrrigation) return deny();
          return run(() =>
            saveScheduleAction(access.accountId, id, schedule, userId),
          );
        },
        deleteIrrigationSchedule: (id) => {
          const access = accessFor(id);
          if (!access?.canManageIrrigation) return deny();
          return run(() =>
            deleteScheduleAction(access.accountId, id, userId),
          );
        },
      }}
    >
      {error && (
        <div
          role="alert"
          className="mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-card p-4 text-sm"
        >
          <p>{t(error)}</p>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void reload()}>
            {t("Reload cloud data")}
          </Button>
        </div>
      )}
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const value = useContext(FarmContext);
  if (!value) throw new Error("useFarm must be used inside FarmProvider");
  return value;
}
