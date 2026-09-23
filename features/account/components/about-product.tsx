"use client";
import Link from "next/link";
import {
  Sprout,
  CloudSun,
  Droplets,
  RadioTower,
  MessageCircle,
  Globe2,
  LifeBuoy,
} from "lucide-react";
import { APP } from "@/constants/app";
import { useTranslation } from "@/features/settings/hooks/use-translation";

const capabilities = [
  [
    "Farm management",
    "Keep your farms, gardens and crops organized.",
    Sprout,
    false,
  ],
  [
    "Weather intelligence",
    "See local conditions and forecasts for your farm.",
    CloudSun,
    false,
  ],
  [
    "Irrigation planning",
    "Keep your next watering date, time and duration in view.",
    Droplets,
    false,
  ],
  [
    "Sensors",
    "Connected soil readings are planned for a future update.",
    RadioTower,
    true,
  ],
  [
    "AI assistance",
    "Personal farm advice is planned for a future update.",
    MessageCircle,
    true,
  ],
] as const;
export function AboutProduct() {
  const t = useTranslation();
  return (
    <>
      <section className="app-card app-theme-surface max-w-4xl p-6 sm:p-9">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sprout size={29} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold">AgroMind</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Simple tools for everything you grow")}
            </p>
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
          {t(
            "AgroMind brings your farms, local weather and irrigation plans into one calm, clear space.",
          )}
        </p>
        <div className="mt-7 border-s-2 border-gold/60 ps-5">
          <h3 className="font-semibold">{t("Our mission")}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            {t(
              "Make everyday farm decisions easier to understand, for everyone who grows.",
            )}
          </p>
        </div>
      </section>
      <section aria-labelledby="about-capabilities" className="max-w-4xl">
        <h2 id="about-capabilities" className="mb-5 text-lg font-semibold">
          {t("Built around your farm")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {capabilities.map(([title, description, Icon, planned]) => (
            <article key={title} className="app-card p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="app-icon-container">
                  <Icon size={20} aria-hidden="true" />
                </span>
                {planned && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {t("Coming soon")}
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-semibold">{t(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(description)}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="app-card flex max-w-4xl flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
        <p className="text-sm text-muted-foreground">
          {t("App version")}{" "}
          <bdi className="font-medium text-foreground">{APP.version}</bdi>
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="app-secondary-link">
            <Globe2 size={17} aria-hidden="true" />
            {t("Website")}
          </Link>
          <Link href="/account/help" className="app-secondary-link">
            <LifeBuoy size={17} aria-hidden="true" />
            {t("Help & Support")}
          </Link>
        </div>
      </section>
    </>
  );
}
