import { BrainCircuit, CloudSun, Droplets, Radio, UserRound } from "lucide-react";
import { Section } from "@/components/layout/section";
import { T } from "@/features/settings/components/translated-text";
import { Reveal } from "./landing-motion";
import styles from "../landing.module.css";

const SYSTEM = [
  { icon: Radio, title: "Sensors", detail: "Read the field" },
  { icon: CloudSun, title: "Weather", detail: "Understand conditions" },
  { icon: Droplets, title: "Irrigation", detail: "Control every drop" },
  { icon: BrainCircuit, title: "AI", detail: "Turn data into action" },
  { icon: UserRound, title: "Farmer", detail: "Decide with confidence" },
] as const;

export function ValueProposition() {
  return (
    <Section className="relative py-24 sm:py-28" variant="muted">
      <div id="system" className="scroll-mt-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary"><T text="Connected intelligence" /></span>
        <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-5xl"><T text="One farm. One intelligent system." /></h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"><T text="AgroMind connects field signals, local weather and irrigation into one clear operating picture—then helps you act on it." /></p>
      </Reveal>
      <Reveal delay={0.12} className={`${styles.flowTrack} relative mt-14 grid gap-4 md:grid-cols-5 md:gap-3`}>
        <span className={styles.flowPulse} aria-hidden="true" />
        {SYSTEM.map(({ icon: Icon, title, detail }) => (
          <div key={title} className="relative z-10 flex items-center gap-4 rounded-2xl border border-primary/10 bg-card/85 p-4 shadow-sm backdrop-blur md:flex-col md:border-0 md:bg-transparent md:p-0 md:text-center md:shadow-none">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-background text-primary shadow-sm md:size-18 md:rounded-3xl"><Icon className="size-5 md:size-7" /></div>
            <div><h3 className="font-semibold"><T text={title} /></h3><p className="mt-1 text-xs text-muted-foreground"><T text={detail} /></p></div>
          </div>
        ))}
      </Reveal>
      </div>
    </Section>
  );
}
