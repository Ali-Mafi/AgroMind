"use client";

import { useEffect } from "react";
import { useSettings } from "@/features/settings/context/settings-context";
import { saveAccountPreferences } from "@/features/settings/services/account-preferences";

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
  const {
    country,
    isHydrated,
    language: resolvedLanguage,
    preferences,
    update,
  } = useSettings();
  const regionConfirmed = preferences.regionConfirmed;

  useEffect(() => {
    if (!isHydrated) return;

    if (!regionConfirmed) {
      if (!profileCountry) return;
      update((previous) => ({
        ...previous,
        country: profileCountry,
        language: profileLanguage === "fa" ? "fa" : "en",
        regionConfirmed: true,
      }));
      return;
    }

    const language = resolvedLanguage === "fa" ? "fa" : "en";
    if (country === profileCountry && language === profileLanguage) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveAccountPreferences(
        { country_code: country, language },
        userId,
      );
    }, 300);

    return () => window.clearTimeout(timer);
  }, [
    country,
    isHydrated,
    profileCountry,
    profileLanguage,
    regionConfirmed,
    resolvedLanguage,
    update,
    userId,
  ]);

  return null;
}
