"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, CloudSun, Droplets, Leaf, MapPin, Radio, Sprout, Waves } from "lucide-react";
import { HERO } from "@/constants/landing";
import { AppContainer } from "@/components/layout/app-container";
import { buttonVariants } from "@/components/ui/button";
import { REGION_PROFILES } from "@/features/settings/constants/region-profiles";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { Float, Reveal } from "./landing-motion";
import styles from "../landing.module.css";

export function Hero() {
  const { country, format } = useSettings();
  const t = useTranslation();
  const sample = REGION_PROFILES[country].example;

  return (
    <section className={`${styles.hero} relative isolate min-h-[calc(100svh-4rem)] overflow-hidden py-16 sm:py-20 lg:flex lg:items-center lg:py-24`}>
      <div className={`${styles.fieldPattern} pointer-events-none absolute inset-0 -z-10 opacity-80`} />
      <div className="pointer-events-none absolute -end-28 top-20 -z-10 size-80 rounded-full bg-primary/10 blur-3xl" />
      <AppContainer>
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3.5 py-2 text-xs font-semibold text-primary shadow-sm backdrop-blur-md sm:text-sm">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40 motion-reduce:animate-none" /><span className="relative inline-flex size-2 rounded-full bg-primary" /></span>
              {t("Live field intelligence")}
            </div>
            <h1 className="mt-6 max-w-3xl font-heading text-4xl font-extrabold leading-[1.03] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl">{t(HERO.title)}</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{t(HERO.subtitle)}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={buttonVariants({ size: "lg", className: "min-h-12 rounded-2xl px-7 shadow-lg shadow-primary/15" })}>{t(HERO.primaryButton)} <ArrowRight className="rtl:rotate-180" /></Link>
              <a href="#live-farm" className={buttonVariants({ variant: "outline", size: "lg", className: "min-h-12 rounded-2xl border-primary/20 bg-background/55 px-7 backdrop-blur" })}>{t(HERO.secondaryButton)}</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground sm:text-sm">
              <span className="flex items-center gap-2"><CloudSun className="size-4 text-primary" />{t("Hyper-local weather")}</span>
              <span className="flex items-center gap-2"><Waves className="size-4 text-primary" />{t("Smarter water use")}</span>
              <span className="flex items-center gap-2"><BrainCircuit className="size-4 text-primary" />{t("Actionable AI")}</span>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="relative mx-auto w-full max-w-2xl">
            <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-primary/12 blur-2xl" />
            <Float>
              <div className={`${styles.previewShell} relative overflow-hidden rounded-[2rem] border border-white/15 p-4 text-white sm:p-6`}>
                <div className={`${styles.previewGrid} pointer-events-none absolute inset-0 opacity-50`} />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><Radio className="size-3.5" />{t("Live overview")}</div>
                      <h2 className="mt-2 font-heading text-xl font-bold sm:text-2xl">{t("Sample farm")}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60 sm:text-sm"><MapPin className="size-3.5" />{t(sample.location)}</p>
                      <p className="mt-1 text-[11px] text-white/45">{t(sample.crop)} · {format.measure(sample.area, "area")}</p>
                    </div>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">{t("All systems online")}</span>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <PreviewMetric icon={CloudSun} label={t("Weather")} value={format.measure(sample.temperature, "temperature", 0)} detail={t("Clear skies")} />
                    <PreviewMetric icon={Droplets} label={t("Soil moisture")} value={`${format.number(48, 0)}%`} detail={t("In target range")} />
                    <PreviewMetric icon={Waves} label={t("Irrigation")} value={t("Scheduled")} detail={t("Starts at {time}", { time: format.clock("18:30") })} />
                    <PreviewMetric icon={Leaf} label={t("Crop health")} value={`${format.number(92, 0)}%`} detail={t("Stable")} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1.25fr_0.75fr]">
                    <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
                      <div className="flex items-center justify-between text-xs text-white/60"><span>{t("Moisture trend")}</span><span>{t("Last 24 hours")}</span></div>
                      <div className="mt-5 flex h-16 items-end gap-1.5" aria-hidden="true">
                        {[38, 46, 43, 55, 50, 62, 58, 70, 64, 76, 72, 81].map((height, index) => <span key={index} className="flex-1 rounded-t-full bg-linear-to-t from-emerald-500/35 to-emerald-200/90" style={{ height: `${height}%` }} />)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-200/15 bg-amber-200/8 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-200"><BrainCircuit className="size-4" />{t("AI recommendation")}</div>
                      <p className="mt-3 text-sm font-medium leading-6 text-white/90">{t("Delay irrigation until evening to reduce evaporation.")}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-[11px] text-white/45"><Sprout className="size-3.5" />{t("Sample farm · Not live data")}</p>
                </div>
              </div>
            </Float>
          </Reveal>
        </div>
      </AppContainer>
    </section>
  );
}

function PreviewMetric({ icon: Icon, label, value, detail }: { icon: typeof CloudSun; label: string; value: string; detail: string }) {
  return <div className="min-w-0 rounded-2xl border border-white/10 bg-white/7 p-3 sm:p-4"><Icon className="size-4 text-emerald-200" /><p className="mt-3 truncate text-[11px] text-white/55">{label}</p><strong className="mt-1 block truncate text-sm sm:text-base">{value}</strong><p className="mt-1 truncate text-[10px] text-white/45">{detail}</p></div>;
}
