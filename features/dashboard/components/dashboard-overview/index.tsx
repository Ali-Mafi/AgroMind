"use client";
import Link from "next/link";
import {
  CalendarClock,
  MapPin,
  Plus,
  Sprout,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  EmptyState,
  SectionHeader,
  StatusCard,
} from "@/components/ui/workspace";
import { FarmSwitcher } from "@/features/farms/components/farm-switcher";
import { FarmOverviewCards } from "@/features/farms/components/farm-overview-cards";
import { useWorkspaceFarm } from "@/features/farms/hooks/use-workspace-farm";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { useSettings } from "@/features/settings/context/settings-context";
import { parseLocalDate } from "@/features/settings/lib/calendar";

export function DashboardOverview() {
  const { farms, farm, selectFarm, irrigationSchedules } = useWorkspaceFarm();
  const t = useTranslation();
  const { format } = useSettings();
  if (!farm)
    return (
      <main className="app-page">
        <PageHeader
          title={t("Home")}
          description={t("A clear view of your growing day.")}
        />
        <EmptyState
          title={t("Start with your first farm")}
          description={t(
            "Add a farm or garden to keep weather, crops and irrigation together.",
          )}
          action={
            <Link href="/farms/new" className="app-primary-link">
              <Plus size={18} />
              {t("Add Farm")}
            </Link>
          }
        />
      </main>
    );
  const schedule = irrigationSchedules[farm.id];
  const needsLocation = !farm.coordinates;
  return (
    <main className="app-page">
      <PageHeader
        eyebrow={t("Home")}
        title={farm.name}
        description={
          <span className="inline-flex items-center gap-2">
            <MapPin size={16} aria-hidden="true" />
            {farm.location}
          </span>
        }
        action={
          <FarmSwitcher
            farms={farms}
            selectedFarmId={farm.id}
            onFarmChange={selectFarm}
          />
        }
      />
      <StatusCard
        label={t("Your farm today")}
        title={t(
          needsLocation
            ? "Give your farm a location"
            : schedule
              ? "Irrigation is on your calendar"
              : "Plan your next irrigation",
        )}
        icon={
          needsLocation ? (
            <MapPin size={38} />
          ) : schedule ? (
            <CalendarClock size={38} />
          ) : (
            <Sprout size={38} />
          )
        }
        action={
          <Link
            href={
              needsLocation
                ? `/farms/${farm.id}/edit`
                : `/irrigation?farm=${encodeURIComponent(farm.id)}`
            }
            className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            {t(
              needsLocation
                ? "Add farm location"
                : schedule
                  ? "Review schedule"
                  : "Schedule irrigation",
            )}
            <ArrowUpRight size={17} className="rtl:-rotate-90" />
          </Link>
        }
      >
        {needsLocation
          ? t("Local weather starts with the right place.")
          : schedule
            ? `${format.date(parseLocalDate(schedule.date) ?? new Date())} · ${format.clock(schedule.time)} · ${format.number(schedule.duration)} ${t("min")}`
            : t("Choose a time and keep your next watering easy to find.")}
      </StatusCard>
      <section>
        <SectionHeader
          title={t("At a glance")}
          action={
            <Link
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
              href={`/farms/${farm.id}`}
            >
              {t("Farm overview")}
              <ArrowUpRight size={17} />
            </Link>
          }
        />
        <FarmOverviewCards farm={farm} schedule={schedule} />
      </section>
    </main>
  );
}
