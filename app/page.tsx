import { Navbar } from "@/features/landing/components/navbar";
import { Hero } from "@/features/landing/components/hero";
import { FeatureHighlights } from "@/features/landing/components/feature-highlights";
import { Capabilities } from "@/features/landing/components/capabilities";
import { ValueProposition } from "@/features/landing/components/value-proposition";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <Hero />

      <ValueProposition />

      <FeatureHighlights />

      <Capabilities />

    </>
  );
}