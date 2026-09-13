"use client";
import Link from "next/link";
import { BadgeCheck, Sprout, UserRound, Crown } from "lucide-react";
import { useFarm } from "@/features/farms/context/farm-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { AccountShell, accountCardClass } from "./account-shell";
export function AccountOverview() {
  const { cloud, farmLimit } = useFarm();
  const t = useTranslation();
  return (
    <AccountShell title="Your account">
      {!cloud.profile.onboarding_completed && (
        <Link
          href="/onboarding"
          className="block rounded-2xl border border-gold/40 bg-gold/10 p-5 font-semibold"
        >
          {t("Continue setting up your account")}
        </Link>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <section className={accountCardClass}>
          <UserRound className="text-primary" />
          <h2 className="font-bold">{t("Profile")}</h2>
          <p className="text-xl font-semibold">{cloud.profile.full_name}</p>
          <p className="break-all text-sm text-muted-foreground">
            <bdi>{cloud.user.email}</bdi>
          </p>
          <Link
            href="/account/profile"
            className="inline-flex min-h-11 items-center font-semibold text-primary"
          >
            {t("Edit profile")}
          </Link>
        </section>
        <section className={accountCardClass}>
          <BadgeCheck className="text-primary" />
          <h2 className="font-bold">{t("Account status")}</h2>
          <p>
            {t(cloud.user.verified ? "Email verified" : "Verification pending")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              cloud.profile.onboarding_completed
                ? "Onboarding completed"
                : "Onboarding in progress",
            )}
          </p>
        </section>
        <section className={accountCardClass}>
          <Crown className="text-gold" />
          <h2 className="font-bold">{t("Current plan")}</h2>
          <p className="text-3xl font-bold">{t(cloud.plan.name)}</p>
          <Link
            href="/account/subscription"
            className="inline-flex min-h-11 items-center font-semibold text-primary"
          >
            {t("View subscription")}
          </Link>
        </section>
        <section className={accountCardClass}>
          <Sprout className="text-primary" />
          <h2 className="font-bold">{t("Farm usage")}</h2>
          <p className="text-3xl font-bold">
            <bdi>
              {cloud.account.farm_count} / {farmLimit}
            </bdi>
          </p>
          <progress
            aria-label={t("Farm usage")}
            max={Math.max(1, farmLimit)}
            value={cloud.account.farm_count}
            className="h-2 w-full accent-primary"
          />
          <Link
            href="/farms"
            className="inline-flex min-h-11 items-center font-semibold text-primary"
          >
            {t("Manage farms")}
          </Link>
        </section>
      </div>
    </AccountShell>
  );
}
