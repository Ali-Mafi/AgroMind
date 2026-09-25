"use client";
import { useEffect, useRef } from "react";
import { NavigationArrow } from "@/components/ui/navigation-arrow";
import Link from "next/link";
import {
  CalendarClock,
  MapPin,
  Plus,
  Sprout,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  EmptyState,
  SectionHeader,
  StatusCard,
} from "@/components/ui/workspace";
import { FarmSwitcher } from "@/features/farms/components/farm-switcher";
import { FarmPhoto, FARM_HEADER_SIZES } from "@/features/farms/components/farm-photo";
import { FarmOverviewCards } from "@/features/farms/components/farm-overview-cards";
import { useWorkspaceFarm } from "@/features/farms/hooks/use-workspace-farm";
import { resolveFarmHeaderBackground } from "@/features/farms/lib/resolve-farm-visual";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { useSettings } from "@/features/settings/context/settings-context";
import { parseLocalDate } from "@/features/settings/lib/calendar";
import styles from "./dashboard-overview.module.css";

export function DashboardOverview() {
  const { farms, farm, selectFarm, irrigationSchedules } = useWorkspaceFarm();
  const t = useTranslation();
  const { format } = useSettings();
  const contentRef = useRef<HTMLDivElement>(null);
  const farmId = farm?.id;

  useEffect(() => {
    const content = contentRef.current;
    if (!content || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Animate the existing tree: remounting it would reset weather subscriptions
    // and disclosure state, and can introduce an unnecessary loading flash.
    const tokens = getComputedStyle(content);
    const duration = parseFloat(tokens.getPropertyValue("--motion-panel")) || 220;
    const animation = content.animate(
      [{ opacity: 0.82, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }],
      { duration, easing: tokens.getPropertyValue("--motion-ease").trim() || "ease-out" },
    );
    return () => animation.cancel();
  }, [farmId]);

  if (!farm)
    return (
      <main className={`app-page ${styles.dashboard} ${styles.emptyDashboard}`} data-dashboard-immersive>
        <PageHeader
          title={t("Home")}
          description={t("A clear view of your growing day.")}
        />
        <EmptyState
          className={styles.empty}
          title={t("Start with your first farm")}
          description={t(
            "Add a farm or garden to keep weather, crops and irrigation together.",
          )}
          action={
            <Link href="/farms/new" className="app-primary-link">
              <Plus size={18} aria-hidden="true" />
              {t("Add Farm")}
            </Link>
          }
        />
      </main>
    );
  const schedule = irrigationSchedules[farm.id];
  const needsLocation = !farm.coordinates;
  const headerPhoto = resolveFarmHeaderBackground(farm.type);

  return (
    <main
      className={`app-page ${styles.dashboard}`}
      data-dashboard-immersive
    >
      <div className={styles.header} data-farm-type={farm.type}>
        <FarmPhoto src={headerPhoto} sizes={FARM_HEADER_SIZES} prominent className={styles.headerPhoto} />
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
              compact
            />
          }
        />
      </div>
      <div ref={contentRef} className={styles.content}>
        <StatusCard
          className={`${styles.hero} ${needsLocation ? styles.needsLocation : schedule ? styles.scheduled : styles.unscheduled}`}
          backdrop={<FarmPhoto src={headerPhoto} sizes={FARM_HEADER_SIZES} className={styles.heroPhoto} />}
          label={<span className={styles.heroLabel}><span aria-hidden="true" className={styles.statusDot} />{t("Your farm today")}</span>}
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
              className={`${styles.heroAction} inline-flex min-h-12 items-center gap-3 rounded-xl bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted`}
            >
              {t(
                needsLocation
                  ? "Add farm location"
                  : schedule
                    ? "Review schedule"
                    : "Schedule irrigation",
              )}
              <NavigationArrow size={17} />
            </Link>
          }
        >
          {needsLocation
            ? t("Local weather starts with the right place.")
            : schedule
              ? `${format.date(parseLocalDate(schedule.date) ?? new Date())} · ${format.clock(schedule.time)} · ${format.number(schedule.duration)} ${t("min")}`
              : t("Choose a time and keep your next watering easy to find.")}
        </StatusCard>
        <section className={styles.overview}>
          <SectionHeader
            title={t("At a glance")}
            action={
              <Link
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
                href={`/farms/${farm.id}`}
              >
                {t("Farm overview")}
                <NavigationArrow size={17} />
              </Link>
            }
          />
          <FarmOverviewCards farm={farm} schedule={schedule} appearance="dashboard" />
        </section>
      </div>
    </main>
  );
}
