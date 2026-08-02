import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: SectionVariant;
}

type SectionVariant =
  | "default"
  | "muted"
  | "green";

export function Section({
  children,
  className,
  variant = "default",
}: SectionProps) {
    const variants = {
  default: "bg-background",

  muted: "bg-muted/30",

  green: "bg-green-50",
};
  return (
    <section
className={cn(
  "w-full py-20",
  variants[variant],
  className
)}
    >
      <div className="mx-auto w-full max-w-7xl px-6">
        {children}
      </div>
    </section>
  );
}