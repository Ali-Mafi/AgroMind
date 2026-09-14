import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/authentication/services/session";
import { parseEntitlements } from "@/features/entitlements/lib/entitlements";
import type { Json } from "@/lib/supabase/database.types";
import { farmSchema, scheduleSchema } from "../lib/validation";
import type { CloudSnapshot } from "../types";

type SnapshotPayload = {
  profile: CloudSnapshot["profile"] | null;
  account: CloudSnapshot["account"] | null;
  plan: CloudSnapshot["plan"] | null;
  subscription: CloudSnapshot["subscription"] | null;
  entitlements: Json;
  farms: Json[];
  irrigationSchedules: Record<string, Json>;
  migration: CloudSnapshot["migration"];
};

type SnapshotRpcClient = {
  rpc: (name: "get_cloud_snapshot") => Promise<{
    data: Json | null;
    error: { message: string } | null;
  }>;
};

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
    farms: snapshot.farms.map((farm) => farmSchema.parse(farm)),
    irrigationSchedules: Object.fromEntries(
      Object.entries(snapshot.irrigationSchedules).map(([farmId, schedule]) => [
        farmId,
        scheduleSchema.parse(schedule),
      ]),
    ),
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
