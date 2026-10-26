import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/features/authentication/services/session";
import { SupportPage } from "@/features/support/components/workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return <SupportPage ticketId={id} />;
}
