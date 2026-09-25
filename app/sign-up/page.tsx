import { AuthEntry } from "@/features/authentication/components/auth-entry";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; status?: string }>;
}) {
  return <AuthEntry mode="signup" {...(await searchParams)} />;
}

export const dynamic = "force-dynamic";
