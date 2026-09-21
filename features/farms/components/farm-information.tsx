"use client";
import Link from "next/link";
import { RadioTower, Sprout } from "lucide-react";
import { useFarm } from "../context/farm-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { useSettings } from "@/features/settings/context/settings-context";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/workspace";
import { FarmSectionNavigation } from "./farm-section-navigation";

export function FarmInformation({
  id,
  kind,
}: {
  id: string;
  kind: "sensors" | "insights";
}) {
  const { farms } = useFarm();
  const farm = farms.find((f) => f.id === id);
  const t = useTranslation();
  const { format } = useSettings();
  if (!farm)
    return (
      <main className="app-page">
        <PageHeader back title={t("Farm not found")} />
        <EmptyState
          title={t("Farm not found")}
          description={t("The selected farm or garden does not exist.")}
        />
      </main>
    );
  return (
    <main className="app-page">
      <PageHeader
        back
        eyebrow={farm.name}
        title={t(kind === "sensors" ? "Sensors" : "Crop insights")}
        description={farm.location}
      />
      {kind === "sensors" ? (
        <>
          <FarmSectionNavigation farmId={id} active="Sensors" />
          <EmptyState
            icon={<RadioTower size={28} />}
            title={t("No sensors connected")}
            description={t(
              "Soil readings will appear when a sensor is connected.",
            )}
          />
        </>
      ) : (
        <>
          <section className="app-card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-lg font-semibold">
              <Sprout size={22} className="text-primary" />
              {t(farm.type === "garden" ? "Plants / Trees" : "Crop")}
            </h2>
            {farm.type === "garden" ? (
              farm.plants?.length ? (
                <ul className="mt-5 divide-y">
                  {farm.plants.map((plant) => (
                    <li
                      key={plant.id}
                      className="flex flex-wrap justify-between gap-3 py-4"
                    >
                      <span className="font-medium">
                        {plant.name || t("Unnamed plant")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t("Quantity")}: {format.number(plant.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-muted-foreground">
                  {t("No plants or trees added")}
                </p>
              )
            ) : (
              <p className="mt-5 text-2xl font-semibold">
                {farm.crop?.name || t("Crop not added yet")}
              </p>
            )}
            <Link
              href={`/farms/${id}/edit`}
              className="app-secondary-link mt-6"
            >
              {t("Edit crop details")}
            </Link>
          </section>
          <section className="app-card p-6">
            <h2 className="font-semibold">
              {t("AI analysis is not available yet")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t(
                "Your crop information is saved. Personal advice will be available in a future update.",
              )}
            </p>
            <Link
              href={`/assistant?farm=${encodeURIComponent(id)}`}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary"
            >
              {t("AgroMind Assistant")}
            </Link>
          </section>
        </>
      )}
    </main>
  );
}
