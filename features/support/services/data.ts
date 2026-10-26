import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/authentication/services/session";
import { redirect } from "next/navigation";
import type { Json } from "@/lib/supabase/database.types";
// Narrow boundary until generated schema is refreshed after migration deployment.
export async function supportClient() {
  await requireUser();
  const client = await createClient();
  return client as unknown as {
    rpc(
      name: "support_read" | "support_command" | "support_is_staff",
      args?: { p: Json },
    ): Promise<{ data: Json | null; error: { message: string } | null }>;
  };
}
export async function requireSupportStaff() {
  const client = await supportClient();
  const { data, error } = await client.rpc("support_is_staff");
  if (error || data !== true) redirect("/account/security");
  return client;
}
