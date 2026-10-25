import type { Metadata } from "next";
import { NOTICES } from "@/features/legal/content";
import { LegalPage } from "@/features/legal/components/legal-page";
export const metadata: Metadata = {
  title: "AgroMind | " + NOTICES.terms.en.title,
  description: NOTICES.terms.en.description,
};
export default function Page() { return <LegalPage kind="terms" />; }
