import type { Metadata } from "next";
import { NOTICES } from "@/features/legal/content";
import { LegalPage } from "@/features/legal/components/legal-page";
export const metadata: Metadata = {
  title: "AgroMind | " + NOTICES.privacy.en.title,
  description: NOTICES.privacy.en.description,
};
export default function Page() { return <LegalPage kind="privacy" />; }
