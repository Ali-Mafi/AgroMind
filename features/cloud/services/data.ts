import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/authentication/services/session";
import { parseEntitlements } from "@/features/entitlements/lib/entitlements";
import { farmSchema, scheduleSchema } from "../lib/validation";
import type { CloudSnapshot } from "../types";

export const readCloudSnapshot = cache(async (): Promise<CloudSnapshot> => {
  const user = await requireUser();
  const supabase = await createClient();
  const accountResult = await supabase
    .from("accounts")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();
  if (accountResult.error)
    throw new Error("Your cloud data could not be loaded. Please try again.");
  const account = accountResult.data;
  const [profile, subscription, farms, schedules, entitlements, migration] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("account_id", account.id)
        .single(),
      supabase
        .from("farms")
        .select("data")
        .eq("account_id", account.id)
        .order("created_at"),
      supabase
        .from("irrigation_schedules")
        .select("farm_id,data")
        .eq("account_id", account.id),
      supabase.rpc("get_entitlements"),
      supabase
        .from("legacy_imports")
        .select("fingerprint,imported_farms,imported_schedules,created_at")
        .eq("account_id", account.id)
        .maybeSingle(),
    ]);
  if (
    profile.error ||
    subscription.error ||
    farms.error ||
    schedules.error ||
    entitlements.error ||
    migration.error
  )
    throw new Error("Your cloud data could not be loaded. Please try again.");
  const plan = await supabase
    .from("plans")
    .select("*")
    .eq("id", subscription.data.plan_id)
    .single();
  if (plan.error)
    throw new Error("Your subscription could not be loaded. Please try again.");
  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      verified: Boolean(user.email_confirmed_at),
      createdAt: user.created_at,
    },
    profile: profile.data,
    account,
    plan: plan.data,
    subscription: subscription.data,
    entitlements: parseEntitlements(entitlements.data),
    farms: farms.data.map((row) => farmSchema.parse(row.data)),
    irrigationSchedules: Object.fromEntries(
      schedules.data.map((row) => [
        row.farm_id,
        scheduleSchema.parse(row.data),
      ]),
    ),
    migration: migration.data,
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
