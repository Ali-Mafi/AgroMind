import { Navbar } from "@/features/landing/components/navbar";
import { Hero } from "@/features/landing/components/hero";
import { ValueProposition } from "@/features/landing/components/value-proposition";
import { FeatureHighlights } from "@/features/landing/components/feature-highlights";
import { Capabilities } from "@/features/landing/components/capabilities";
import { PwaInstall } from "@/features/landing/components/pwa-install";
import { CTA } from "@/features/landing/components/cta";
import { Footer } from "@/features/landing/components/footer";

export default function HomePage() {
  return (
    <main className="overflow-x-clip">
      <Navbar />

      <Hero />

      <ValueProposition />

      <FeatureHighlights />

      <Capabilities />

      <PwaInstall />

      <CTA />

      <Footer />

    </main>
  );
}
