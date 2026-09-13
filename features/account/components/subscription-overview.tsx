"use client";
import { Check, Minus } from "lucide-react";
import { useFarm } from "@/features/farms/context/farm-context";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  can,
  getLimit,
  type Capability,
  type Resource,
} from "@/features/entitlements/lib/entitlements";
import { AccountShell, accountCardClass } from "./account-shell";
const resources: [Resource, string][] = [
  ["farms", "Farms"],
  ["sensors", "Sensors"],
  ["team_members", "Team members"],
  ["ai_requests", "AI requests per month"],
];
const capabilities: [Capability, string][] = [
  ["irrigation:advanced", "Advanced irrigation"],
  ["automation:use", "Automation access"],
  ["analytics:advanced", "Advanced analytics"],
];
export function SubscriptionOverview() {
  const { cloud } = useFarm();
  const t = useTranslation();
  const { format } = useSettings();
  return (
    <AccountShell title="Subscription">
      <section className={accountCardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("Current plan")}</p>
            <h2 className="mt-2 text-3xl font-bold">{t(cloud.plan.name)}</h2>
          </div>
          <span className="rounded-full bg-gold/15 px-4 py-2 text-sm font-semibold">
            {t(cloud.subscription.status)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Started")} · {format.date(new Date(cloud.subscription.starts_at))}
        </p>
        {cloud.subscription.ends_at && (
          <p className="text-sm">
            {t("Ends")} · {format.date(new Date(cloud.subscription.ends_at))}
          </p>
        )}
        <dl className="divide-y">
          {resources.map(([resource, label]) => (
            <div
              key={resource}
              className="flex items-center justify-between gap-4 py-4 text-sm"
            >
              <dt>{t(label)}</dt>
              <dd className="font-bold">
                {getLimit(cloud.entitlements, resource)}
              </dd>
            </div>
          ))}
          {capabilities.map(([capability, label]) => {
            const enabled = can(
              {
                entitlements: cloud.entitlements,
                farmCount: cloud.account.farm_count,
              },
              capability,
            );
            return (
              <div
                key={capability}
                className="flex items-center justify-between gap-4 py-4 text-sm"
              >
                <dt>{t(label)}</dt>
                <dd className="flex items-center gap-2">
                  {enabled ? (
                    <Check size={17} className="text-primary" />
                  ) : (
                    <Minus size={17} className="text-muted-foreground" />
                  )}
                  {t(enabled ? "Included" : "Not included")}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </AccountShell>
  );
}
