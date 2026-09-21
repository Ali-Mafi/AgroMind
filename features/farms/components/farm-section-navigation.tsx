"use client";
import Link from "next/link";
import { useTranslation } from "@/features/settings/hooks/use-translation";
export function FarmSectionNavigation({
  farmId,
  active = "Overview",
}: {
  farmId: string;
  active?: "Overview" | "Weather" | "Irrigation" | "Sensors";
}) {
  const t = useTranslation();
  const links = [
    ["Overview", `/farms/${farmId}`],
    ["Weather", `/weather?farm=${encodeURIComponent(farmId)}`],
    ["Irrigation", `/irrigation?farm=${encodeURIComponent(farmId)}`],
    ["Sensors", `/farms/${farmId}/sensors`],
  ];
  return (
    <nav
      aria-label={t("Farm navigation")}
      className="grid grid-cols-4 gap-1 border-b pb-2 sm:flex sm:gap-3"
    >
      {links.map(([label, href]) => (
        <Link
          key={label}
          href={href}
          aria-current={label === active ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center rounded-xl px-2 text-xs font-medium transition-colors sm:px-5 sm:text-sm ${label === active ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted"}`}
        >
          {t(label)}
        </Link>
      ))}
    </nav>
  );
}
