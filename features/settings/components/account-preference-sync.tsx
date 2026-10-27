"use client";

import { useEffect } from "react";
import { useSettings } from "@/features/settings/context/settings-context";
import { preferencesFromProfile } from "../lib/account-preferences";

type Props = {
  userId: string;
  profileCountry: string | null;
  profileLanguage: string;
};

export function AccountPreferenceSync({
  userId,
  profileCountry,
  profileLanguage,
}: Props) {
  const { isHydrated, update } = useSettings();

  useEffect(() => {
    if (!isHydrated || !profileCountry) return;
    // Cloud values seed this account and reflect successful profile saves.
    // Hydration and navigation must never write old device values to the server.
    update((previous) => {
      const next = preferencesFromProfile(previous, profileCountry, profileLanguage);
      return next.country === previous.country &&
        next.language === previous.language &&
        next.regionConfirmed === previous.regionConfirmed
        ? previous
        : next;
    });
  }, [userId, profileCountry, profileLanguage, isHydrated, update]);

  return null;
}
