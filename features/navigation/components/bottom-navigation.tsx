"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { House, Sprout, MessageCircle, UserRound } from "lucide-react";
import { useTranslation } from "@/features/settings/hooks/use-translation";

const items = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/farms", label: "Farms", icon: Sprout },
  { href: "/assistant", label: "Assistant", icon: MessageCircle },
  { href: "/account", label: "Account", icon: UserRound },
] as const;

export function BottomNavigation() {
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = navigation.current;
    const workspace = element?.closest<HTMLElement>(".agromind-app");
    if (!element || !workspace) return;
    // Respect safe areas, translated labels and larger system text sizes.
    const measure = () => workspace.style.setProperty("--app-bottom-navigation-height", `${element.offsetHeight}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => {
      observer.disconnect();
      workspace.style.removeProperty("--app-bottom-navigation-height");
    };
  }, []);
  const pathname = usePathname();
  const t = useTranslation();
  const params = useSearchParams();
  const pathFarm = pathname.match(/^\/farms\/([^/]+)(?:\/|$)/)?.[1];
  const farm = pathFarm && pathFarm !== "new" ? pathFarm : params.get("farm");
  const target = (href: string) =>
    farm ? `${href}?farm=${encodeURIComponent(farm)}` : href;
  const active = pathname.startsWith("/settings")
    ? "/account"
    : pathname.startsWith("/irrigation")
      ? "/farms"
      : pathname;
  return (
    <aside ref={navigation} className="app-navigation fixed inset-x-0 bottom-0 z-50 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:inset-x-auto lg:inset-y-0 lg:start-0 lg:flex lg:w-60 lg:flex-col lg:border-e lg:border-t-0 lg:p-6">
      <Link
        href={target("/dashboard")}
        className="mb-14 hidden min-h-12 items-center gap-3 text-xl font-bold tracking-tight lg:flex"
        aria-label="AgroMind"
      >
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sprout size={22} />
        </span>
        AgroMind
      </Link>
      <nav
        aria-label={t("Main navigation")}
        className="mx-auto grid max-w-xl grid-cols-4 gap-1 px-2 py-2 lg:mx-0 lg:flex lg:max-w-none lg:flex-col lg:gap-2 lg:p-0"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const selected = active === href || active.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={target(href)}
              aria-current={selected ? "page" : undefined}
              className={`app-navigation-link flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs transition-colors lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-sm ${selected ? "bg-primary/8 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Icon
                size={21}
                strokeWidth={selected ? 2.1 : 1.65}
                aria-hidden="true"
              />
              <span>{t(label)}</span>
              {selected && (
                <span
                  aria-hidden="true"
                  className="ms-auto hidden size-1.5 rounded-full bg-primary lg:block"
                />
              )}
            </Link>
          );
        })}
      </nav>
      <p className="mt-auto hidden border-t pt-5 text-xs leading-5 text-muted-foreground lg:block">
        {t("A little clarity. A better growing day.")}
      </p>
    </aside>
  );
}
