import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/authentication/services/session";
import { parseEntitlements } from "@/features/entitlements/lib/entitlements";
import type { Json } from "@/lib/supabase/database.types";
import { farmSchema, scheduleSchema } from "../lib/validation";
import type {
  CloudSnapshot,
  FarmAccess,
  FarmAccessRole,
  WorkspaceFarm,
} from "../types";

type SharedFarmRow = {
  account_id: string;
  farm_id: string;
  role: FarmAccessRole;
  data: Json;
};

type SharedScheduleRow = {
  account_id: string;
  farm_id: string;
  data: Json;
};

type SnapshotPayload = {
  profile: CloudSnapshot["profile"] | null;
  account: CloudSnapshot["account"] | null;
  plan: CloudSnapshot["plan"] | null;
  subscription: CloudSnapshot["subscription"] | null;
  entitlements: Json;
  farms: Json[];
  irrigationSchedules: Record<string, Json>;
  sharedFarms?: SharedFarmRow[];
  sharedIrrigationSchedules?: SharedScheduleRow[];
  migration: CloudSnapshot["migration"];
};

type SnapshotRpcClient = {
  rpc: (name: "get_cloud_snapshot") => Promise<{
    data: Json | null;
    error: { message: string } | null;
  }>;
};

function workspaceKey(accountId: string, farmId: string) {
  return `${accountId}:${farmId}`;
}

function farmAccess(
  accountId: string,
  farmId: string,
  role: FarmAccessRole,
): FarmAccess {
  return {
    accountId,
    farmId,
    workspaceKey: workspaceKey(accountId, farmId),
    role,
    owned: role === "owner",
    canEditFarm: role === "owner" || role === "manager",
    canDeleteFarm: role === "owner",
    canManageIrrigation:
      role === "owner" || role === "manager" || role === "worker",
  };
}

function parseSharedRole(value: unknown): FarmAccessRole {
  if (value === "manager" || value === "worker" || value === "viewer")
    return value;
  throw new Error("Invalid shared farm role.");
}

function parseWorkspaceFarms(
  accountId: string,
  owned: Json[],
  shared: SharedFarmRow[],
) {
  const ids = new Set<string>();
  const farms: WorkspaceFarm[] = [];

  const add = (
    data: Json,
    targetAccountId: string,
    role: FarmAccessRole,
    expectedFarmId?: string,
  ) => {
    const parsed = farmSchema.parse(data);
    if (expectedFarmId && parsed.id !== expectedFarmId)
      throw new Error("Shared farm identity mismatch.");

    // Existing routes and selectors still address farms by farm.id. Reject the
    // astronomically unlikely cross-account collision instead of silently
    // showing or mutating the wrong farm. A later routing milestone can move
    // the URL surface to workspaceKey without changing persisted Farm data.
    if (ids.has(parsed.id))
      throw new Error("Ambiguous farm identity in workspace.");
    ids.add(parsed.id);

    farms.push({
      ...parsed,
      access: farmAccess(targetAccountId, parsed.id, role),
    });
  };

  for (const data of owned) add(data, accountId, "owner");
  for (const row of shared)
    add(row.data, row.account_id, parseSharedRole(row.role), row.farm_id);

  return farms;
}

export const readCloudSnapshot = cache(async (): Promise<CloudSnapshot> => {
  const user = await requireUser();
  const supabase = await createClient();

  // This RPC keeps RLS in force while collapsing the previous account + batch +
  // plan request waterfall into one database round trip.
  const result = await (supabase as unknown as SnapshotRpcClient).rpc(
    "get_cloud_snapshot",
  );

  if (result.error || !result.data) {
    throw new Error("Your cloud data could not be loaded. Please try again.");
  }

  const snapshot = result.data as unknown as SnapshotPayload;
  if (
    !snapshot.profile ||
    !snapshot.account ||
    !snapshot.plan ||
    !snapshot.subscription ||
    !Array.isArray(snapshot.farms) ||
    !snapshot.irrigationSchedules
  ) {
    throw new Error("Your cloud data could not be loaded. Please try again.");
  }

  const sharedFarms = Array.isArray(snapshot.sharedFarms)
    ? snapshot.sharedFarms
    : [];
  const farms = parseWorkspaceFarms(
    snapshot.account.id,
    snapshot.farms,
    sharedFarms,
  );
  const accessibleIds = new Set(farms.map((farm) => farm.id));

  const irrigationSchedules = Object.fromEntries(
    Object.entries(snapshot.irrigationSchedules).map(([farmId, schedule]) => [
      farmId,
      scheduleSchema.parse(schedule),
    ]),
  );

  const sharedSchedules = Array.isArray(snapshot.sharedIrrigationSchedules)
    ? snapshot.sharedIrrigationSchedules
    : [];
  for (const row of sharedSchedules) {
    if (!accessibleIds.has(row.farm_id))
      throw new Error("Shared irrigation schedule has no accessible farm.");
    if (irrigationSchedules[row.farm_id])
      throw new Error("Ambiguous irrigation schedule in workspace.");
    irrigationSchedules[row.farm_id] = scheduleSchema.parse(row.data);
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      verified: Boolean(user.email_confirmed_at),
      createdAt: user.created_at,
    },
    profile: snapshot.profile,
    account: snapshot.account,
    plan: snapshot.plan,
    subscription: snapshot.subscription,
    entitlements: parseEntitlements(snapshot.entitlements),
    farms,
    irrigationSchedules,
    migration: snapshot.migration,
  };
});

export async function mutationContext() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();
  if (error) throw new Error("Account services are temporarily unavailable.");
  return { supabase, user, accountId: data.id };
}
