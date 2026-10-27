import { notFound } from "next/navigation";
import { z } from "zod";
import { requireSupportStaff } from "@/features/support/services/data";
import { SupportPage } from "@/features/support/components/workspace";
import ProtectedLayout from "@/features/authentication/components/protected-layout";
import { AppShell } from "@/components/layout/app-shell";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  await requireSupportStaff();
  const { ticket } = await searchParams;
  if (ticket && !z.uuid().safeParse(ticket).success) notFound();
  return (
    <ProtectedLayout>
      <AppShell>
        <SupportPage key={ticket ?? "list"} staff ticketId={ticket} />
      </AppShell>
    </ProtectedLayout>
  );
}
