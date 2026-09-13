"use client";
import { useFarm } from "@/features/farms/context/farm-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { AccountShell, accountCardClass } from "./account-shell";
import { downloadBackup } from "@/features/cloud/lib/legacy-storage";
import { getLegacyBackupAction } from "@/features/cloud/services/actions";
import { Button } from "@/components/ui/button";
import { useState } from "react";
export function UsageOverview() {
  const { cloud, farmLimit } = useFarm();
  const t = useTranslation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <AccountShell title="Usage">
      <div className="grid gap-5 sm:grid-cols-2">
        <section className={accountCardClass}>
          <h2 className="font-bold">{t("Farm usage")}</h2>
          <p className="text-4xl font-bold">
            <bdi>
              {cloud.account.farm_count} / {farmLimit}
            </bdi>
          </p>
          <progress
            aria-label={t("Farm usage")}
            value={cloud.account.farm_count}
            max={Math.max(1, farmLimit)}
            className="h-2 w-full accent-primary"
          />
        </section>
        <section className={accountCardClass}>
          <h2 className="font-bold">{t("Saved irrigation schedules")}</h2>
          <p className="text-4xl font-bold">
            {Object.keys(cloud.irrigationSchedules).length}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("Schedules stored securely with your farms.")}
          </p>
        </section>
        <section className={accountCardClass}>
          <h2 className="font-bold">{t("Additional usage")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("Sensor, team and AI usage tracking is not active yet.")}
          </p>
        </section>
        {cloud.migration && (
          <section className={accountCardClass}>
            <h2 className="font-bold">{t("Local backup imported")}</h2>
            <p className="text-sm">
              {t(
                "{count} farms were imported. The complete original backup is available below.",
                { count: cloud.migration.imported_farms },
              )}
            </p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = await getLegacyBackupAction(cloud.user.id);
                  if (result.ok) downloadBackup(result.data);
                  else setError(result.error);
                } catch {
                  setError(
                    "The backup could not be downloaded. Please try again.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("Download backup")}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {t(error)}
              </p>
            )}
          </section>
        )}
      </div>
    </AccountShell>
  );
}
