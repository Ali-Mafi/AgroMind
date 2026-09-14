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
    const resolved = resolvePreferences({ ...preferences, ...change });
    const saved = await run(() => saveAccountPreferences(
      { country_code: resolved.country, language: resolved.language },
      cloud.user.id,
    ));
    if (saved) update(change);
  }

  return <SettingsPanel onLocaleChange={saveLocale} savingLocale={busy} />;
}
