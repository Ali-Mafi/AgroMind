import { AuthEntry } from "@/features/authentication/components/auth-entry";
export default function Page() {
  return <AuthEntry mode="signup" />;
}

export const dynamic = "force-dynamic";
