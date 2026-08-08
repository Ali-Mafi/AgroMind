import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";

export function CTA() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-primary-foreground sm:px-10 lg:px-16">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
            Start with AgroMind
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to make smarter farming decisions?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
            Monitor your farms, optimize irrigation, analyze weather and make
            better farming decisions with AI.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="h-12 rounded-2xl px-8 font-semibold"
            >
              Start Farming
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
      </div>
    </Section>
  );
}