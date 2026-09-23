"use client";

import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/features/settings/context/settings-context";

/** Only reading-direction navigation is mirrored, never send or vertical icons. */
export function NavigationArrow({
  toward = "forward",
  chevron = false,
  className,
  size = 18,
}: {
  toward?: "back" | "forward";
  chevron?: boolean;
  className?: string;
  size?: number;
}) {
  const { direction } = useSettings();
  const pointsLeft = (toward === "back") !== (direction === "rtl");
  const Icon = chevron
    ? pointsLeft
      ? ChevronLeft
      : ChevronRight
    : pointsLeft
      ? ArrowLeft
      : ArrowRight;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
