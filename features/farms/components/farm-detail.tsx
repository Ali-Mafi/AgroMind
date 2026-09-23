"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Pencil, Trash2, Sprout } from "lucide-react";
import { useFarm } from "../context/farm-context";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, SectionHeader } from "@/components/ui/workspace";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { FarmSectionNavigation } from "./farm-section-navigation";
import { FarmOverviewCards } from "./farm-overview-cards";
import { getIrrigationTypeLabel } from "../constants/irrigation-types";

export function FarmDetail({ id }: { id: string }) {
  const { farms, irrigationSchedules, deleteFarm, busy } = useFarm();
  const { format } = useSettings();
  const t = useTranslation();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const farm = farms.find((f) => f.id === id);
  if (!farm)
    return (
      <main className="app-page">
        <PageHeader title={t("Farm not found")} back />
        <EmptyState
          title={t("Farm not found")}
          description={t("The selected farm or garden does not exist.")}
        />
      </main>
    );
  const garden = farm.type === "garden";
  return (
    <main className="app-page">
      <PageHeader
        back
        eyebrow={t(garden ? "Garden" : "Farm")}
        title={farm.name}
        description={
          <>
            {farm.location}
            <span aria-hidden="true"> · </span>
            {garden
              ? t("Garden / Orchard")
              : farm.crop?.name || t("Crop not added yet")}
            <span aria-hidden="true"> · </span>
            <bdi>
              {format.measure(farm.area, garden ? "gardenArea" : "area")}
            </bdi>
          </>
        }
        action={
          <Link className="app-secondary-link" href={`/farms/${id}/edit`}>
            <Pencil size={16} />
            {t("Edit")}
          </Link>
        }
      />
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sprout size={16} className="text-primary" aria-hidden="true" />
        {t(
          irrigationSchedules[id]
            ? "Irrigation scheduled"
            : "No irrigation scheduled",
        )}
      </p>
      <FarmSectionNavigation farmId={id} />
      <section>
        <SectionHeader title={t("Overview")} />
        <FarmOverviewCards
          farm={farm}
          schedule={irrigationSchedules[id]}
          showSensors
        />
      </section>
      <Disclosure className="app-card p-5 sm:p-6" title={t(garden ? "Garden Information" : "Farm Information")}>

        <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("Area")}</dt>
            <dd className="mt-1">
              {format.measure(farm.area, garden ? "gardenArea" : "area")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("Irrigation Type")}</dt>
            <dd className="mt-1">
              {t(getIrrigationTypeLabel(farm.irrigationType))}
            </dd>
          </div>
        </dl>
        {garden && (
          <ul className="mt-6 divide-y">
            {farm.plants?.map((plant) => (
              <li key={plant.id} className="py-4">
                <p className="font-medium">
                  {plant.name || t("Unnamed plant")}
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t("Quantity")}
                    </dt>
                    <dd className="mt-1">{format.number(plant.quantity)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t("Spacing")}
                    </dt>
                    <dd className="mt-1">
                      {format.measure(plant.spacing, "length")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t("Age")}
                    </dt>
                    <dd className="mt-1">
                      {format.number(plant.age)} {t("yrs")}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Disclosure>
      <Dialog.Root open={deleting} onOpenChange={setDeleting}>
        <Dialog.Trigger
          render={
            <Button variant="ghost" className="min-h-11 text-destructive" />
          }
        >
          <Trash2 size={16} />
          {t("Delete")} {t(garden ? "Garden" : "Farm")}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="app-backdrop fixed inset-0 z-[80] bg-foreground/40" />
          <Dialog.Popup className="agromind-surface app-dialog fixed start-1/2 top-1/2 z-[90] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-card p-6 text-foreground shadow-xl rtl:translate-x-1/2">
            <Dialog.Title className="text-xl font-semibold">
              {t("Delete")} {farm.name}?
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("This action cannot be undone.")}
            </Dialog.Description>
            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <Dialog.Close
                render={<Button variant="outline" className="min-h-11" />}
                disabled={busy}
              >
                {t("Cancel")}
              </Dialog.Close>
              <Button
                variant="destructive"
                className="min-h-11"
                disabled={busy}
                onClick={async () => {
                  if (busy || !(await deleteFarm(id))) return;
                  setDeleting(false);
                  router.push("/farms");
                }}
              >
                {t(busy ? "Please wait…" : "Confirm Delete")}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
