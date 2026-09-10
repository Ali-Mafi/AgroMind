"use client";

import { BrainCircuit, CloudRain, Droplets, Gauge, Leaf, Map, MapPin, Sparkles, TimerReset, Waves } from "lucide-react";
import { Section } from "@/components/layout/section";
import { T } from "@/features/settings/components/translated-text";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { Reveal } from "./landing-motion";

const FEATURES = [
  { kind: "weather", eyebrow: "Weather Intelligence", title: "Know what is coming to every field.", description: "Live conditions, rainfall timing and farm-local forecasts turn weather into practical field decisions." },
  { kind: "irrigation", eyebrow: "Smart Irrigation", title: "Water with timing, context and control.", description: "Coordinate schedules, soil moisture and weather signals before every irrigation cycle." },
  { kind: "farm", eyebrow: "Farm Management", title: "Keep every farm, garden and crop in view.", description: "Organize locations, growing areas, crops and field activity without losing the operational picture." },
  { kind: "ai", eyebrow: "AI Recommendations", title: "Move from raw signals to the next best action.", description: "AgroMind turns connected farm data into concise, explainable recommendations you can review and act on." },
] as const;

export function FeatureHighlights() {
  return (
    <Section className="py-24 sm:py-32">
      <Reveal className="max-w-3xl" >
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary"><T text="Built around the work" /></span>
        <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-5xl"><T text="From forecast to field action." /></h2>
        <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg"><T text="Four connected capabilities, designed as one agricultural workflow—not a collection of disconnected tools." /></p>
      </Reveal>
      <div id="features" className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.kind}>
            <article className="grid items-center gap-9 lg:grid-cols-2 lg:gap-20">
              <div className={index % 2 ? "lg:order-2" : ""}>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary"><span className="h-px w-7 bg-primary/50" /><T text={feature.eyebrow} /></span>
                <h3 className="mt-5 max-w-xl font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl"><T text={feature.title} /></h3>
                <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg"><T text={feature.description} /></p>
                <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-primary"><Sparkles className="size-4" /><T text="Designed for real field decisions" /></div>
              </div>
              <ProductVisual kind={feature.kind} reverse={Boolean(index % 2)} />
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function ProductVisual({ kind, reverse }: { kind: typeof FEATURES[number]["kind"]; reverse: boolean }) {
  const { format } = useSettings();
  const t = useTranslation();
  const shell = `relative overflow-hidden rounded-[2rem] border border-primary/10 bg-linear-to-br from-card via-card to-primary/8 p-5 shadow-[0_24px_70px_rgba(11,70,47,0.12)] sm:p-7 ${reverse ? "lg:order-1" : ""}`;
  if (kind === "weather") return <div className={shell}><div className="rounded-3xl bg-linear-to-br from-sky-900 via-slate-700 to-emerald-900 p-5 text-white sm:p-7"><div className="flex justify-between"><div><p className="text-xs text-white/60"><T text="Local conditions" /></p><strong className="mt-2 block text-5xl">{format.temperature(24)}</strong><p className="mt-2 text-sm"><T text="Rain arriving this evening" /></p></div><CloudRain className="size-12 text-sky-200" /></div><div className="mt-8 flex h-20 items-end gap-2">{[18, 24, 31, 58, 82, 66, 42, 28].map((height, index) => <span key={index} className="flex-1 rounded-t-xl bg-sky-300/70" style={{ height: `${height}%` }} />)}</div><div className="mt-3 flex justify-between text-[10px] text-white/50"><span><T text="Now" /></span><span><T text="Tonight" /></span></div></div></div>;
  if (kind === "irrigation") return <div className={shell}><div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]"><div className="flex min-h-56 flex-col items-center justify-center rounded-3xl bg-primary p-6 text-primary-foreground"><div className="flex size-28 items-center justify-center rounded-full border-[10px] border-white/15 border-t-white/90"><Droplets className="size-10" /></div><strong className="mt-5"><T text="Ready to irrigate" /></strong><span className="mt-1 text-xs text-white/65"><T text="Weather check complete" /></span></div><div className="space-y-3"><VisualRow icon={Waves} title="Soil moisture" value={`${format.number(48, 0)}%`} /><VisualRow icon={TimerReset} title="Next schedule" value={format.clock("18:30")} /><VisualRow icon={Gauge} title="Irrigation zone" value={t("Zone 2")} /></div></div></div>;
  if (kind === "farm") return <div className={shell}><div className="relative min-h-72 overflow-hidden rounded-3xl bg-emerald-950 p-5 text-white"><div className="absolute inset-0 opacity-30 [background-image:linear-gradient(115deg,transparent_45%,rgba(255,255,255,.18)_46%,transparent_48%),repeating-linear-gradient(25deg,rgba(88,180,112,.35)_0_8px,transparent_8px_20px)]" /><div className="relative flex items-center justify-between"><span className="text-xs font-semibold"><T text="Farm map" /></span><Map className="size-5 text-emerald-200" /></div><div className="relative mt-12 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur"><MapPin className="size-4 text-amber-300" /><strong className="mt-3 block"><T text="North field" /></strong><small className="text-white/55"><T text="Corn · Active" /></small></div><div className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur"><Leaf className="size-4 text-emerald-300" /><strong className="mt-3 block"><T text="Walnut garden" /></strong><small className="text-white/55"><T text="Healthy" /></small></div></div></div></div>;
  return <div className={shell}><div className="rounded-3xl border border-amber-200/20 bg-linear-to-br from-amber-50 to-emerald-50 p-5 text-emerald-950 dark:from-amber-100 dark:to-emerald-100 sm:p-7"><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-900 text-emerald-100"><BrainCircuit /></div><div><strong><T text="AgroMind insight" /></strong><p className="text-xs text-emerald-950/55"><T text="Based on connected farm data" /></p></div></div><div className="mt-6 rounded-2xl bg-white/70 p-5 shadow-sm"><p className="text-base font-semibold leading-7"><T text="Delay irrigation until evening to reduce evaporation." /></p><div className="mt-5 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-sky-100 px-3 py-1.5">{t("Rain probability {value}", { value: `${format.number(12, 0)}%` })}</span><span className="rounded-full bg-emerald-100 px-3 py-1.5"><T text="Moisture stable" /></span></div></div><div className="mt-4 flex items-center justify-between text-xs"><span><T text="Confidence" /></span><strong>{format.number(92, 0)}%</strong></div></div></div>;
}

function VisualRow({ icon: Icon, title, value }: { icon: typeof Waves; title: string; value: string }) {
  return <div className="flex min-h-16 items-center gap-3 rounded-2xl border bg-background/70 p-4"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground"><T text={title} /></p><strong className="mt-0.5 block truncate text-sm">{value}</strong></div></div>;
}
