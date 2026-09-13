"use client";
import { useEffect, useState } from "react";
import { CloudUpload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/features/farms/context/farm-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { importLegacyAction } from "../services/actions";
import {
  downloadBackup,
  markLegacyImported,
  readLegacyData,
  type LegacyRead,
} from "../lib/legacy-storage";
export function LegacyMigration() {
  const { cloud, busy, run, farmLimit } = useFarm();
  const [local, setLocal] = useState<LegacyRead>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const t = useTranslation();
  useEffect(() => {
    let found: LegacyRead;
    try {
      found = readLegacyData(localStorage, cloud.user.id);
    } catch {
      found = {
        error: "Browser storage is unavailable. Your cloud data is safe.",
      };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(found);
    setSelected(
      found.snapshot?.farms.slice(0, farmLimit).map((farm) => farm.id) ?? [],
    );
  }, [cloud.user.id, farmLimit]);
  if (dismissed || cloud.migration || (!local.raw && !local.error)) return null;
  const allowed = Boolean(local.snapshot && cloud.farms.length === 0);
  return (
    <section
      aria-label={t("Move your farms to the cloud")}
      className="mx-auto mt-5 w-[calc(100%-2rem)] max-w-6xl space-y-4 rounded-3xl border border-gold/40 bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <CloudUpload className="mt-1 shrink-0 text-primary" />
        <div>
          <h2 className="font-bold">{t("Move your farms to the cloud")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t(
              "Local data was found on this device. Import it only if it belongs to this account. The original backup will be kept.",
            )}
          </p>
          <p className="mt-1 text-sm">
            <bdi>{cloud.user.email}</bdi>
          </p>
        </div>
      </div>
      {local.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(local.error)}
        </p>
      )}
      {allowed && (
        <>
          <p className="text-sm">
            {t(
              "Choose up to {limit} farms. Other farms remain in the complete backup.",
              { limit: farmLimit },
            )}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {local.snapshot!.farms.map((farm) => (
              <label
                key={farm.id}
                className="flex min-h-12 items-center gap-3 rounded-xl border p-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(farm.id)}
                  disabled={
                    busy ||
                    (!selected.includes(farm.id) &&
                      selected.length >= farmLimit)
                  }
                  onChange={(event) =>
                    setSelected((ids) =>
                      event.target.checked
                        ? [...ids, farm.id]
                        : ids.filter((id) => id !== farm.id),
                    )
                  }
                  className="size-4 accent-primary"
                />
                <span>{farm.name}</span>
              </label>
            ))}
          </div>
        </>
      )}
      {!allowed && !local.error && (
        <p className="text-sm text-muted-foreground">
          {t(
            "Your cloud already contains farms. The local backup has not been changed.",
          )}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {allowed && (
          <Button
            disabled={busy || !selected.length}
            className="min-h-11 rounded-xl"
            onClick={async () => {
              const ok = await run(() =>
                importLegacyAction(local.snapshot, selected, cloud.user.id),
              );
              if (ok) {
                try {
                  markLegacyImported(localStorage, cloud.user.id);
                } catch {
                  /* Cloud receipt is authoritative. */
                }
              }
            }}
          >
            {t(busy ? "Please wait…" : "Import into this account")}
          </Button>
        )}
        {local.raw && (
          <Button
            variant="outline"
            className="min-h-11 gap-2 rounded-xl"
            onClick={() => downloadBackup(local.snapshot ?? local.raw)}
          >
            <Download />
            {t("Download backup")}
          </Button>
        )}
        <Button
          variant="ghost"
          className="min-h-11 rounded-xl"
          disabled={busy}
          onClick={() => setDismissed(true)}
        >
          {t("Later")}
        </Button>
      </div>
    </section>
  );
}
