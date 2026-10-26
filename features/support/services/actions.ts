"use server";
import { after } from "next/server";
import { supportClient, requireSupportStaff } from "./data";
import { commandSchema, readSchema, type SupportData } from "../lib/schema";
import { drainSupportEmails } from "./notifications";
const failed = "Support is unavailable. Please try again.";
function errorText(message: string) {
  if (message.includes("SUPPORT_RATE"))
    return "Too many requests. Please try again later.";
  if (message.includes("SUPPORT_MFA"))
    return "Verify a fresh authenticator code before continuing.";
  if (message.includes("SUPPORT_CONFLICT"))
    return "This ticket changed. Refresh and try again.";
  if (message.includes("SUPPORT_CLOSED"))
    return "Reopen a resolved ticket before replying. Closed tickets require support.";
  if (message.includes("SUPPORT_DENIED"))
    return "This ticket is unavailable or you do not have access.";
  return failed;
}
export async function readSupport(
  input: unknown,
): Promise<{ data?: SupportData; error?: string }> {
  const parsed = readSchema.safeParse(input);
  if (!parsed.success) return { error: failed };
  const client = parsed.data.staff
    ? await requireSupportStaff()
    : await supportClient();
  const { data, error } = await client.rpc("support_read", { p: parsed.data });
  return error
    ? { error: errorText(error.message) }
    : { data: data as SupportData };
}
export async function writeSupport(
  input: unknown,
): Promise<{ id?: string; error?: string }> {
  const parsed = commandSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Check the ticket fields and try again." };
  const client =
    parsed.data.action === "update" ||
    (parsed.data.action === "reply" && parsed.data.internal)
      ? await requireSupportStaff()
      : await supportClient();
  const { data, error } = await client.rpc("support_command", {
    p: parsed.data,
  });
  if (error) return { error: errorText(error.message) };
  after(async () => {
    await drainSupportEmails();
  });
  return { id: (data as { id: string }).id };
}
