"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/authentication/services/session";
import { COUNTRY_CODES } from "@/features/settings/constants/locale-options";

const accountPreferencesSchema = z
  .object({
    country_code: z
      .string()
      .refine((value) => COUNTRY_CODES.includes(value), "Choose a valid country."),
    language: z.enum(["en", "fa"]),
  })
  .strict();

export async function saveAccountPreferences(
  input: unknown,
  expectedUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = accountPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your region and language." };
  }

  const user = await requireUser();
  if (user.id !== expectedUserId) {
    return { ok: false, error: "Your account changed. Reload before saving." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update(parsed.data)
      .eq("id", user.id);

    if (error) throw error;
    return { ok: true };
  } catch {
    return { ok: false, error: "Your preferences could not be synced to your account." };
  }
}
