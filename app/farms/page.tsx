"use client";
import Link from "next/link";
import { MapPin, Plus, Sprout, TreePine, ArrowUpRight } from "lucide-react";
import { useFarm } from "@/features/farms/context/farm-context";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/workspace";

export default function FarmsPage() {
  const { farms, irrigationSchedules } = useFarm();
  const { format } = useSettings();
  const t = useTranslation();
  const add = <Link href="/farms/new" className="app-primary-link"><Plus size={18} />{t("Add Farm")}</Link>;
  return <main className="app-page"><PageHeader title={t("My Farms")} description={t("A place for everything you grow.")} action={farms.length ? add : undefined} />
    {farms.length ? <section aria-label={t("My farms and gardens")} className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{farms.map(farm => {
      const garden = farm.type === "garden";
      return <article key={farm.id} className="app-card overflow-hidden"><Link href={`/farms/${farm.id}`} className="app-card-link block h-full p-5 sm:p-6">
        <div className="mb-7 flex items-center justify-between"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">{garden ? <TreePine size={23} /> : <Sprout size={23} />}</span><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{t(garden ? "Garden" : "Farm")}</span></div>
        <h2 className="break-words text-xl font-semibold">{farm.name}</h2><p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><MapPin size={15} className="mt-1 shrink-0" aria-hidden="true" />{farm.location}</p>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-5"><div><dt className="text-xs text-muted-foreground">{t("Area")}</dt><dd className="mt-1.5 text-sm font-medium"><bdi>{format.measure(farm.area, garden ? "gardenArea" : "area")}</bdi></dd></div><div><dt className="text-xs text-muted-foreground">{t(garden ? "Plants / Trees" : "Crop")}</dt><dd className="mt-1.5 break-words text-sm font-medium">{garden ? format.number(farm.plants?.length ?? 0) : farm.crop?.name || t("Not specified")}</dd></div></dl>
        <div className="mt-6 flex items-center justify-between gap-2 text-sm"><span className="inline-flex items-center gap-2 text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />{t(irrigationSchedules[farm.id] ? "Irrigation scheduled" : "No irrigation scheduled")}</span><ArrowUpRight size={18} className="shrink-0 text-primary rtl:-rotate-90" aria-hidden="true" /></div>
      </Link></article>;
    })}</section> : <EmptyState title={t("No farms or gardens yet")} description={t("Add a farm or garden to keep weather, crops and irrigation together.")} action={add} />}
  </main>;
}
