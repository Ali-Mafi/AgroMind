import { EmailEntry } from "@/features/authentication/components/email-entry";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; proof?: string; status?: string }>;
}) {
  const params = await searchParams;
  return (
    <EmailEntry kind="reset" hash={params.token_hash} proof={params.proof} status={params.status} />
  );
}

export const dynamic = "force-dynamic";
