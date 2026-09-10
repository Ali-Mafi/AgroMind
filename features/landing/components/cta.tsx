import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AppContainer } from "@/components/layout/app-container";
import { buttonVariants } from "@/components/ui/button";
import { T } from "@/features/settings/components/translated-text";
import { Reveal } from "./landing-motion";

export function CTA() {
  return <section className="relative overflow-hidden py-24 sm:py-32"><AppContainer><Reveal><div className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground shadow-[0_30px_80px_rgba(10,75,48,0.22)] sm:px-10 sm:py-20"><div className="pointer-events-none absolute -end-20 -top-28 -z-10 size-72 rounded-full bg-white/12 blur-3xl" /><div className="pointer-events-none absolute -bottom-40 -start-16 -z-10 size-80 rounded-full bg-amber-300/12 blur-3xl" /><div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><Sparkles /></div><h2 className="mx-auto mt-6 max-w-3xl font-heading text-3xl font-bold tracking-tight sm:text-5xl"><T text="Ready to run your farm smarter?" /></h2><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-primary-foreground/70 sm:text-lg"><T text="Bring every field decision into one calm, connected workspace." /></p><Link href="/login" className={buttonVariants({ variant: "secondary", size: "lg", className: "mt-8 min-h-12 rounded-2xl bg-white px-8 text-emerald-950 shadow-xl hover:bg-white/90" })}><T text="Enter AgroMind" /><ArrowRight className="rtl:rotate-180" /></Link></div></Reveal></AppContainer></section>;
}
