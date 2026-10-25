import type { Metadata } from "next";
import { NOTICES } from "@/features/legal/content";
import { LegalPage } from "@/features/legal/components/legal-page";
export const metadata: Metadata = {
  title: "AgroMind | " + NOTICES.cookies.en.title,
  description: NOTICES.cookies.en.description,
};
export default function Page() { return <LegalPage kind="cookies" />; }
