import { EmailEntry } from "@/features/authentication/components/email-entry";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; status?: string }>;
}) {
  const params = await searchParams;
  return (
    <EmailEntry kind="verify" hash={params.token_hash} status={params.status} />
  );
}

export const dynamic = "force-dynamic";
