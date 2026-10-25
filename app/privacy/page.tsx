import type { Metadata } from "next";
import { LEGAL_DOCUMENTS } from "@/features/legal/content";
import { LegalPage } from "@/features/legal/components/legal-page";
export const metadata: Metadata = { title: `AgroMind | ${LEGAL_DOCUMENTS.privacy.en.heading}`, description: LEGAL_DOCUMENTS.privacy.en.intro };
export default function Page() { return <LegalPage kind="privacy" />; }
