"use client";
import Link from "next/link";
import {
  ShieldCheck,
  UserRound,
  Crown,
  ChartNoAxesColumn,
  SlidersHorizontal,
  CircleHelp,
  Info,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { useFarm } from "@/features/farms/context/farm-context";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { AccountShell, LogoutButton } from "./account-shell";
const groups = [
  [
    [
      "/account/profile",
      "Profile",
      "Your details and contact information",
      UserRound,
    ],
    [
      "/account/security",
      "Security",
      "Authenticators, recovery and sessions",
      ShieldCheck,
    ],
  ],
  [
    [
      "/account/subscription",
      "Subscription",
      "Your plan and what is included",
      Crown,
    ],
    [
      "/account/usage",
      "Usage",
      "Your farms and available limits",
      ChartNoAxesColumn,
    ],
  ],
  [
    [
      "/settings",
      "Preferences",
      "Language, units and appearance",
      SlidersHorizontal,
    ],
    ["/account/help", "Help & Support", "Find your next step", CircleHelp],
    [
      "/account/about",
      "About AgroMind",
      "Simple tools for everything you grow",
      Info,
    ],
  ],
] as const;
export function AccountOverview() {
  const { cloud, farmLimit } = useFarm();
  const t = useTranslation();
  const { format } = useSettings();
  return (
    <AccountShell title="Account">
      {!cloud.profile.onboarding_completed && (
        <Link
          href="/onboarding"
          className="app-card block p-5 font-medium text-primary"
        >
          {t("Continue setting up your account")}
        </Link>
      )}
      <section className="app-card p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <UserRound size={23} />
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold">
              {cloud.profile.full_name || t("Your account")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {cloud.profile.username ? (
                <bdi>@{cloud.profile.username}</bdi>
              ) : (
                t("Username not set")
              )}
            </p>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              <bdi>{cloud.user.email}</bdi>
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
              <BadgeCheck size={15} />
              {t(
                cloud.user.verified ? "Email verified" : "Verification pending",
              )}
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-5 border-t pt-5 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t("Current plan")}</p>
            <p className="mt-2 text-lg font-semibold">{t(cloud.plan.name)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("Farm usage")}</p>
            <p className="mt-2 text-lg font-semibold">
              <bdi>
                {format.number(cloud.account.farm_count)} /{" "}
                {format.number(farmLimit)}
              </bdi>
            </p>
            <progress
              aria-label={t("Farm usage")}
              max={Math.max(1, farmLimit)}
              value={cloud.account.farm_count}
              className="mt-2 h-1.5 w-full max-w-56 accent-primary"
            />
          </div>
        </div>
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-2">
        {groups.map((group, i) => (
          <section key={i} className="app-card divide-y overflow-hidden">
            {group.map(([href, label, description, Icon]) => (
              <Link
                href={href}
                key={href}
                className="flex min-h-20 items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 sm:px-6"
              >
                <Icon size={21} className="shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {t(label)}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {t(description)}
                  </span>
                </span>
                <ChevronRight
                  size={17}
                  className="shrink-0 text-muted-foreground rtl:rotate-180"
                />
              </Link>
            ))}
          </section>
        ))}
      </div>
      <LogoutButton />
    </AccountShell>
  );
}
