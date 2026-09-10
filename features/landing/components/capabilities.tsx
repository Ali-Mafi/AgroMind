"use client";

import { BrainCircuit, CheckCircle2, CloudSun, Droplets, Leaf, Radio, Waves } from "lucide-react";
import { AppContainer } from "@/components/layout/app-container";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { Reveal } from "./landing-motion";
import styles from "../landing.module.css";

export function Capabilities() {
  const { format } = useSettings();
  const t = useTranslation();
  return <section id="live-farm" className="scroll-mt-20 bg-muted/30 py-24 sm:py-32"><AppContainer><Reveal><div className={`${styles.livePanel} relative overflow-hidden rounded-[2rem] p-5 text-white sm:p-8 lg:p-12`}><div className={`${styles.terrain} pointer-events-none absolute inset-0 opacity-70`} /><div className="relative grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200"><Radio className="size-4" />{t("Live farm overview")}</div><h2 className="mt-5 font-heading text-3xl font-bold tracking-tight sm:text-5xl">{t("Your farm never stands still.")}</h2><p className="mt-5 max-w-lg text-base leading-7 text-white/65 sm:text-lg">{t("See weather, water, crops and recommendations update together in one operational view.")}</p><div className="mt-8 flex items-center gap-2 text-sm text-emerald-200"><CheckCircle2 className="size-4" />{t("Sample operational data")}</div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><LiveMetric icon={CloudSun} label={t("Current weather")} value={format.measure(24, "temperature", 0)} detail={t("Clear · light wind")} /><LiveMetric icon={Droplets} label={t("Soil moisture")} value={`${format.number(48, 0)}%`} detail={t("Target {low}–{high}", { low: `${format.number(45, 0)}%`, high: `${format.number(60, 0)}%` })} /><LiveMetric icon={Waves} label={t("Irrigation state")} value={t("Ready")} detail={t("Next cycle {time}", { time: format.clock("18:30") })} /><LiveMetric icon={Leaf} label={t("Crop health")} value={`${format.number(92, 0)}%`} detail={t("Stable this week")} /><div className="col-span-2 sm:col-span-2"><LiveMetric wide icon={BrainCircuit} label={t("AI insight")} value={t("Hold irrigation until evening") } detail={t("Lower evaporation expected after sunset") } /></div></div></div></div></Reveal></AppContainer></section>;
}

function LiveMetric({ icon: Icon, label, value, detail, wide = false }: { icon: typeof CloudSun; label: string; value: string; detail: string; wide?: boolean }) {
  return <div className={`h-full min-h-36 rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm sm:p-5 ${wide ? "sm:min-h-32" : ""}`}><div className="flex items-center justify-between"><Icon className="size-5 text-emerald-200" /><span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" /></div><p className="mt-5 text-xs text-white/50">{label}</p><strong className="mt-1 block text-base leading-6 sm:text-lg">{value}</strong><p className="mt-2 text-[11px] text-white/45">{detail}</p></div>;
}
