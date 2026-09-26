import Link from "next/link";
import { redirect } from "next/navigation";
import { InvitationAccept } from "@/features/collaboration/components/invitation-accept";
import { inviteTokenSchema } from "@/features/collaboration/lib/validation";
import {
  currentUser,
  needsSecondFactor,
} from "@/features/authentication/services/session";
import { T } from "@/features/settings/components/translated-text";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const parsed = inviteTokenSchema.safeParse(token);

  if (!parsed.success) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-10">
        <section className="w-full max-w-lg rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">
            <T text="Invitation unavailable" />
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            <T text="This invitation is invalid or no longer available." />
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
          >
            <T text="Go to AgroMind" />
          </Link>
        </section>
      </main>
    );
  }

  const next = `/invite/${parsed.data}`;
  const user = await currentUser();
  if (!user)
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (!user.email_confirmed_at)
    redirect("/verify-email");
  if (await needsSecondFactor())
    redirect(`/mfa?next=${encodeURIComponent(next)}`);

  return (
    <InvitationAccept
      token={parsed.data}
      email={user.email ?? ""}
    />
  );
}
