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
  const settings = useSettings();

  useEffect(() => {
    if (!settings.isHydrated) return;

    if (!settings.preferences.regionConfirmed) {
      if (!profileCountry) return;
      settings.update((previous) => ({
        ...previous,
        country: profileCountry,
        language: profileLanguage === "fa" ? "fa" : "en",
        regionConfirmed: true,
      }));
      return;
    }

    const language = settings.language === "fa" ? "fa" : "en";
    if (
      settings.country === profileCountry &&
      language === profileLanguage
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveAccountPreferences(
        { country_code: settings.country, language },
        userId,
      );
    }, 300);

    return () => window.clearTimeout(timer);
  }, [
    profileCountry,
    profileLanguage,
    settings.country,
    settings.isHydrated,
    settings.language,
    settings.preferences.regionConfirmed,
    settings.update,
    userId,
  ]);

  return null;
}
