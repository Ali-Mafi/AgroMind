"use client";
import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Globe2, LocateFixed, Sprout } from "lucide-react";
import { useSettings } from "../context/settings-context";
import { useTranslation } from "../hooks/use-translation";
import { REGION_PROFILES } from "../constants/region-profiles";
import { COUNTRY_CODES, countryDisplayName } from "../constants/locale-options";
import { countryFromLocale, resolvePreferences } from "../lib/preferences";
import { createFormatters } from "../lib/units";
import { useRegion } from "@/features/region/context/region-context";
import { PreferenceSelect } from "./preference-select";
import type { Country } from "../types/preferences";

function RegionChoice() {
  const settings = useSettings();
  const t = useTranslation();
  const { detectRegionFromLocation } = useRegion();
  const [country, setCountry] = useState<Country>(() => navigator.languages.map(countryFromLocale).find(Boolean) ?? settings.country);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const choiceRevision = useRef(0);
  const preview = resolvePreferences({ ...settings.preferences, country });
  const format = createFormatters(preview);
  const detect = async () => {
    const revision = ++choiceRevision.current;
    setBusy(true); setMessage("");
    try {
      const result = await detectRegionFromLocation();
      const found = result && countryFromLocale(result);
      if (revision !== choiceRevision.current) return;
      if (found) { setCountry(found); setMessage(t("Suggested from your location. Confirm below.")); }
      else setMessage(t("Choose your region manually."));
    } catch { if (revision === choiceRevision.current) setMessage(t("Location unavailable. You can choose your region below.")); }
    finally { setBusy(false); }
  };
  return <Dialog.Root open>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-[90] bg-black/45" />
      <Dialog.Popup className="fixed start-1/2 top-1/2 z-[100] max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl outline-none rtl:translate-x-1/2 sm:p-8">
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Globe2 /></div>
        <Dialog.Title className="text-2xl font-bold">{t("Make AgroMind yours")}</Dialog.Title>
        <Dialog.Description className="my-3 text-sm leading-6 text-muted-foreground">{t("Choose your region for local examples and default units. Language and units can be changed separately in Settings.")}</Dialog.Description>
        <PreferenceSelect label={t("Region")} value={country} options={COUNTRY_CODES.map((value) => ({ value, label: countryDisplayName(value, REGION_PROFILES[country].locale) })).sort((a,b) => a.label.localeCompare(b.label))} onChange={(next) => { choiceRevision.current++; setCountry(next); setMessage(""); }} />
        <button type="button" disabled={busy} onClick={detect} className="my-4 flex items-center gap-2 text-sm font-medium text-primary disabled:opacity-50"><LocateFixed size={17} />{t(busy ? "Detecting region…" : "Suggest from my location")}</button>
        <p role="status" className="text-sm text-muted-foreground">{message}</p>
        <div className="mt-4 space-y-2 rounded-2xl bg-primary/5 p-4 text-sm" dir={preview.direction}>
          <p className="font-semibold">{preview.language === "fa" ? t("Persian · right to left") : t("English")}</p>
          <p dir="ltr">{format.measure(27, "temperature")} · {format.symbol("area")} · {format.symbol("wind")} · {format.symbol("precipitation")}</p>
          <p>{format.date(new Date())}</p>
        </div>
        <button type="button" onClick={() => settings.update({ country, regionConfirmed: true, regionSource: "manual" })} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"><Sprout size={18} />{t("Continue")}</button>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
export function RegionOnboarding() {
  const { isHydrated, preferences } = useSettings();
  return isHydrated && !preferences.regionConfirmed ? <RegionChoice /> : null;
}
