"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/features/authentication/services/session";
import {
  entityIdSchema,
  farmSchema,
  legacySnapshotSchema,
  profileSchema,
  scheduleSchema,
} from "../lib/validation";
import { cloudError } from "../lib/errors";
import { mutationContext, readCloudSnapshot } from "./data";
import type { Json } from "@/lib/supabase/database.types";
import type { CloudResult, CloudSnapshot } from "../types";

const accountIdSchema = z.string().uuid();

function json(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function forbiddenWrite() {
  throw new Error("FARM_WRITE_FORBIDDEN");
}
async function mutate(
  run: (context: Awaited<ReturnType<typeof mutationContext>>) => Promise<void>,
  expectedUserId: string,
): Promise<CloudResult<CloudSnapshot>> {
  const user = await requireUser();
  if (user.id !== expectedUserId)
    return { ok: false, error: "Your account changed. Reload before saving." };
  try {
    await run(await mutationContext());
    revalidatePath("/", "layout");
    return { ok: true, data: await readCloudSnapshot() };
  } catch (error) {
    return { ok: false, error: cloudError(error) };
  }
}
export async function loadCloudData(): Promise<CloudResult<CloudSnapshot>> {
  await requireUser();
  try {
    return { ok: true, data: await readCloudSnapshot() };
  } catch {
    return {
      ok: false,
      error: "Your cloud data could not be loaded. Please try again.",
    };
  }
}
export async function createFarmAction(input: unknown, expectedUserId: string) {
  const parsed = farmSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Please check the farm details." };
  return mutate(async ({ supabase }) => {
    const { error } = await supabase.rpc("create_farm", {
      p_data: json(parsed.data),
    });
    if (error) throw error;
  }, expectedUserId);
}
export async function updateFarmAction(
  accountId: unknown,
  id: unknown,
  input: unknown,
  expectedUserId: string,
) {
  const parsedAccountId = accountIdSchema.safeParse(accountId);
  const parsedId = entityIdSchema.safeParse(id);
  const parsed = farmSchema.partial().omit({ id: true }).safeParse(input);
  if (!parsedAccountId.success || !parsedId.success || !parsed.success)
    return { ok: false as const, error: "Please check the farm details." };
  return mutate(async ({ supabase }) => {
    const existing = await supabase
      .from("farms")
      .select("data")
      .eq("account_id", parsedAccountId.data)
      .eq("id", parsedId.data)
      .single();
    if (existing.error) throw existing.error;
    const merged = farmSchema.parse({
      ...farmSchema.parse(existing.data.data),
      ...parsed.data,
      id: parsedId.data,
    });
    const updated = await supabase
      .from("farms")
      .update({ data: json(merged) })
      .eq("account_id", parsedAccountId.data)
      .eq("id", parsedId.data)
      .select("id")
      .maybeSingle();
    if (updated.error) throw updated.error;
    if (!updated.data) forbiddenWrite();
  }, expectedUserId);
}
export async function deleteFarmAction(
  accountId: unknown,
  id: unknown,
  expectedUserId: string,
) {
  const parsedAccountId = accountIdSchema.safeParse(accountId);
  const parsed = entityIdSchema.safeParse(id);
  if (!parsedAccountId.success || !parsed.success)
    return { ok: false as const, error: "Please check the farm details." };
  return mutate(async ({ supabase }) => {
    const deleted = await supabase
      .from("farms")
      .delete()
      .eq("account_id", parsedAccountId.data)
      .eq("id", parsed.data)
      .select("id")
      .maybeSingle();
    if (deleted.error) throw deleted.error;
    if (!deleted.data) forbiddenWrite();
  }, expectedUserId);
}
export async function saveScheduleAction(
  accountId: unknown,
  farmId: unknown,
  input: unknown,
  expectedUserId: string,
) {
  const parsedAccountId = accountIdSchema.safeParse(accountId);
  const id = entityIdSchema.safeParse(farmId);
  const parsed = scheduleSchema.safeParse(input);
  if (!parsedAccountId.success || !id.success || !parsed.success)
    return {
      ok: false as const,
      error: "Please check the schedule date, time and duration.",
    };
  return mutate(async ({ supabase }) => {
    const { error } = await supabase.rpc("save_shared_irrigation_schedule", {
      p_account_id: parsedAccountId.data,
      p_farm_id: id.data,
      p_data: json(parsed.data),
    });
    if (error) throw error;
  }, expectedUserId);
}
export async function deleteScheduleAction(
  accountId: unknown,
  farmId: unknown,
  expectedUserId: string,
) {
  const parsedAccountId = accountIdSchema.safeParse(accountId);
  const id = entityIdSchema.safeParse(farmId);
  if (!parsedAccountId.success || !id.success)
    return { ok: false as const, error: "Please check the farm details." };
  return mutate(async ({ supabase }) => {
    const deleted = await supabase
      .from("irrigation_schedules")
      .delete()
      .eq("account_id", parsedAccountId.data)
      .eq("farm_id", id.data)
      .select("farm_id")
      .maybeSingle();
    if (deleted.error) throw deleted.error;
    if (!deleted.data) forbiddenWrite();
  }, expectedUserId);
}
export async function importLegacyAction(
  input: unknown,
  selectedIds: unknown,
  expectedUserId: string,
) {
  const snapshot = legacySnapshotSchema.safeParse(input);
  const ids = z.array(entityIdSchema).min(1).max(1000).safeParse(selectedIds);
  if (
    !snapshot.success ||
    !ids.success ||
    JSON.stringify(input).length > 900000
  )
    return {
      ok: false as const,
      error: "The local backup could not be validated. No data was changed.",
    };
  return mutate(async ({ supabase }) => {
    const { error } = await supabase.rpc("import_legacy_data", {
      p_snapshot: json(snapshot.data),
      p_selected_ids: ids.data,
    });
    if (error) throw error;
  }, expectedUserId);
}
export async function saveProfileAction(
  input: unknown,
  expectedUserId: string,
) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false as const,
      error: "Please check your name, country, language and time zone.",
    };
  return mutate(async ({ supabase, user }) => {
    const fullName = `${parsed.data.first_name} ${parsed.data.last_name}`.trim();
    const { error } = await supabase
      .from("profiles")
      .update({ ...parsed.data, full_name: fullName })
      .eq("id", user.id);
    if (error) throw error;
  }, expectedUserId);
}
export async function completeOnboardingAction(expectedUserId: string) {
  return mutate(async ({ supabase }) => {
    const { error } = await supabase.rpc("complete_onboarding");
    if (error) throw error;
  }, expectedUserId);
}

export async function getLegacyBackupAction(
  expectedUserId: string,
): Promise<CloudResult<Json>> {
  const user = await requireUser();
  if (user.id !== expectedUserId)
    return { ok: false, error: "Your account changed. Reload before saving." };
  try {
    const { supabase, accountId } = await mutationContext();
    const { data, error } = await supabase
      .from("legacy_imports")
      .select("snapshot")
      .eq("account_id", accountId)
      .single();
    if (error) throw error;
    return { ok: true, data: data.snapshot };
  } catch {
    return {
      ok: false,
      error: "The backup could not be downloaded. Please try again.",
    };
  }
}
