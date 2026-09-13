import { EmailEntry } from "@/features/authentication/components/email-entry";
export default function Page() {
  return <EmailEntry kind="forgot" />;
}

export const dynamic = "force-dynamic";
