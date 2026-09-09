"use client";
import Link from "next/link";
import { ArrowLeft, Check, Globe2, Ruler, CalendarDays, Palette, SlidersHorizontal } from "lucide-react";
import { ThemeSwitcher } from "@/app/components/theme-switcher";
import { useWeatherMotion } from "@/features/weather/components/hooks/use-weather-motion";
import { useSettings } from "../context/settings-context";
import { useTranslation } from "../hooks/use-translation";
import { REGION_PROFILES, UNIT_NAMES, UNIT_OPTIONS } from "../constants/region-profiles";
import { AUTO_UNITS } from "../lib/preferences";
import { PreferenceSelect } from "./preference-select";
import type { Calendar, Country, Language, Units } from "../types/preferences";
import type { ReactNode } from "react";

const UNIT_LABELS: Record<keyof Units, string> = { temperature: "Temperature", area: "Land area", distance: "Distance", length: "Length & plant spacing", wind: "Wind speed", precipitation: "Rainfall", volume: "Water volume", pressure: "Pressure" };
function Group({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="space-y-6 rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
    <h2 className="flex items-center gap-3 text-lg font-bold"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>{title}</h2>{children}
  </section>;
}
export function SettingsPanel() {
  const settings = useSettings();
  const { preferences, format, update, setUnit } = settings;
  const t = useTranslation();
  const motion = useWeatherMotion();
  const automatic = { value: "auto" as const, label: t("Follow region") };
  const sample = REGION_PROFILES[settings.country].example;
  return <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
    <Link href="/dashboard" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={17} className="rtl:rotate-180" />{t("Back to dashboard")}</Link>
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-widest text-primary">AgroMind</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t("Settings")}</h1><p className="mt-3 text-sm text-muted-foreground">{t("Your region. Your language. Your way of measuring.")}</p></div>
      <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><Check size={16} className="text-primary" />{t(settings.saved ? "Saved on this device" : "Saved for this tab only. Browser storage is unavailable.")}</p>
    </header>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6">
        <Group title={t("Region & language")} icon={<Globe2 size={20} />}>
          <div className="grid gap-5 sm:grid-cols-2">
            <PreferenceSelect label={t("Region")} value={settings.country} options={Object.entries(REGION_PROFILES).map(([value, profile]) => ({ value: value as Country, label: t(profile.name) }))} onChange={(country) => update({ country, regionConfirmed: true, regionSource: "manual" })} />
            <PreferenceSelect<Language | "auto"> label={t("Website language")} value={preferences.language} options={[automatic, { value: "en", label: "English" }, { value: "fa", label: "فارسی" }]} onChange={(language) => update({ language })} description={t("Language changes text and reading direction, independently of units.")} />
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{t("Changing region updates automatic preferences. Your custom choices stay the same.")}</p>
          {["CN", "JP", "TH"].includes(settings.country) && <p className="text-xs text-muted-foreground">{t("English and Persian are available. Other regional languages currently use English.")}</p>}
        </Group>
        <Group title={t("Measurement units")} icon={<Ruler size={20} />}>
          <div className="grid gap-5 sm:grid-cols-2">{(Object.keys(UNIT_OPTIONS) as (keyof Units)[]).map((kind) => <PreferenceSelect key={kind} label={t(UNIT_LABELS[kind])} value={preferences.units[kind]} options={[{ ...automatic, label: `${t("Follow region")} · ${t(UNIT_NAMES[REGION_PROFILES[settings.country].units[kind]])}` }, ...UNIT_OPTIONS[kind].map((value) => ({ value, label: t(UNIT_NAMES[value]) }))]} onChange={(value) => setUnit(kind, value)} />)}</div>
          <button type="button" onClick={() => update({ units: { ...AUTO_UNITS } })} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">{t("Reset units to regional defaults")}</button>
        </Group>
        <Group title={t("Date & time")} icon={<CalendarDays size={20} />}>
          <div className="grid gap-5 sm:grid-cols-2">
            <PreferenceSelect<Calendar | "auto"> label={t("Calendar")} value={preferences.calendar} options={[automatic, { value: "gregory", label: t("Gregorian") }, { value: "persian", label: t("Persian") }, { value: "buddhist", label: t("Buddhist") }]} onChange={(calendar) => update({ calendar })} />
            <PreferenceSelect label={t("Time format")} value={preferences.hourCycle} options={[automatic, { value: "h12", label: t("12-hour") }, { value: "h23", label: t("24-hour") }]} onChange={(hourCycle) => update({ hourCycle })} />
            <PreferenceSelect label={t("Numerals")} value={preferences.numbering} options={[automatic, { value: "latn", label: "123" }, { value: "arabext", label: "۱۲۳" }]} onChange={(numbering) => update({ numbering })} />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{t("Weather times always follow the farm's time zone. Changing region never moves a farm.")}</p>
        </Group>
        <Group title={t("Appearance & motion")} icon={<Palette size={20} />}>
          <div className="space-y-3"><p className="text-sm font-semibold">{t("Theme")}</p><ThemeSwitcher /></div>
          <div className="flex items-center justify-between gap-4 border-t pt-5">
            <div><p className="text-sm font-semibold">{t("Weather animations")}</p><p className="mt-1 text-xs text-muted-foreground">{t(motion.reducedMotion ? "Paused by your device's reduced-motion setting." : "Rain, clouds and other weather effects.")}</p></div>
            <button type="button" role="switch" aria-checked={motion.enabled} aria-label={t("Weather animations")} disabled={motion.reducedMotion} onClick={motion.toggle} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 ${motion.enabled ? "bg-primary" : "bg-muted-foreground/40"}`}><span className={`absolute top-1 size-5 rounded-full bg-white transition-transform motion-reduce:transition-none ${motion.enabled ? "left-6" : "left-1"}`} /></button>
          </div>
        </Group>
      </div>
      <aside className="space-y-5 rounded-3xl border border-primary/20 bg-primary/5 p-6 lg:sticky lg:top-8">
        <h2 className="flex items-center gap-2 font-bold"><SlidersHorizontal size={18} className="text-primary" />{t("Live preview")}</h2>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("Sample farm · Not live data")}</p>
        <div><p className="text-xl font-bold">{t(sample.location)}</p><p className="mt-1 text-sm text-muted-foreground">{t(sample.crop)} · <bdi>{format.measure(sample.area, "area")}</bdi></p></div>
        <p className="text-5xl font-light"><bdi>{format.measure(sample.temperature, "temperature", 0)}</bdi></p>
        <dl className="space-y-3 text-sm">{[[t("Wind speed"), format.measure(16, "wind")], [t("Rainfall"), format.measure(4, "precipitation")], [t("Water volume"), format.measure(1000, "volume")], [t("Date"), format.date(new Date())], [t("Time"), format.clock("17:30")]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">{label}</dt><dd><bdi>{value}</bdi></dd></div>)}</dl>
        <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">{t("Applies to farm forms, weather, charts and irrigation. Stored farm measurements stay unchanged.")}</p>
      </aside>
    </div>
  </main>;
}
