"use client";

import { useFarm } from "@/features/farms/context/farm-context";
import { useSettings } from "../context/settings-context";
import { resolvePreferences } from "../lib/preferences";
import { saveAccountPreferences } from "../services/account-preferences";
import type { Preferences } from "../types/preferences";
import { SettingsPanel } from "./settings-panel";

export function AccountSettingsPanel() {
  const { cloud, run, busy } = useFarm();
  const { preferences, update } = useSettings();

  async function saveLocale(change: Partial<Preferences>) {
    if (busy) return;
    const resolved = resolvePreferences({ ...preferences, ...change });
    // Apply the new display locale and cookie before revalidatePath("/", "layout")
    // can refresh the root HTML. Otherwise the old cookie can reintroduce an
    // outdated dir/lang and font after the client has switched languages.
    const rollback = Object.fromEntries(
      (Object.keys(change) as (keyof Preferences)[]).map((key) => [key, preferences[key]]),
    ) as Partial<Preferences>;
    update(change);
    const saved = await run(() => saveAccountPreferences(
      { country_code: resolved.country, language: resolved.language },
      cloud.user.id,
    ));
    if (!saved) update(rollback);
  }

  return <SettingsPanel onLocaleChange={saveLocale} savingLocale={busy} />;
}
