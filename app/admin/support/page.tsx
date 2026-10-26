import { notFound } from "next/navigation";
import { z } from "zod";
import { requireSupportStaff } from "@/features/support/services/data";
import { SupportPage } from "@/features/support/components/workspace";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  await requireSupportStaff();
  const { ticket } = await searchParams;
  if (ticket && !z.uuid().safeParse(ticket).success) notFound();
  return <SupportPage key={ticket ?? "list"} staff ticketId={ticket} />;
}
