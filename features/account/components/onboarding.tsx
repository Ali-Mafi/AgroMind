"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sprout, CheckCircle2 } from "lucide-react";
import { useFarm } from "@/features/farms/context/farm-context";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { PreferenceSelect } from "@/features/settings/components/preference-select";
import {
  COUNTRY_CODES,
  LANGUAGE_OPTIONS,
  countryDisplayName,
} from "@/features/settings/constants/locale-options";
import {
  completeOnboardingAction,
  saveProfileAction,
} from "@/features/cloud/services/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { accountInputClass } from "@/features/authentication/components/auth-form";
import { LogoutButton } from "./account-shell";
const steps = [
  "Welcome to AgroMind",
  "Your name",
  "Your region",
  "Your language",
  "Your time zone",
  "Your first farm",
];
export function Onboarding() {
  const { cloud, run, busy } = useFarm();
  const settings = useSettings();
  const t = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(cloud.profile.onboarding_step);
  const [name, setName] = useState(cloud.profile.full_name);
  const [country, setCountry] = useState(
    cloud.profile.country_code ?? settings.country,
  );
  const [language, setLanguage] = useState(cloud.profile.language);
  const [timezone, setTimezone] = useState(cloud.profile.timezone);
  const next = async () => {
    if (step === 0 && !name.trim()) {
      setStep(1);
      return;
    }
    const nextStep = Math.min(5, step + 1);
    if (
      await run(() =>
        saveProfileAction(
          {
            full_name: name,
            country_code: country,
            language,
            timezone,
            onboarding_step: nextStep,
          },
          cloud.user.id,
        ),
      )
    )
      setStep(nextStep);
  };
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-primary"
        >
          <Sprout />
          AgroMind
        </Link>
        <LogoutButton />
      </div>
      <section className="space-y-6 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold text-primary">
          {t("Step {current} of {total}", {
            current: step + 1,
            total: steps.length,
          })}
        </p>
        <progress
          aria-label={t("Onboarding progress")}
          value={step + 1}
          max={steps.length}
          className="h-2 w-full accent-primary"
        />
        <h1 className="font-heading text-3xl font-bold">{t(steps[step])}</h1>
        {step === 0 && (
          <p className="text-sm leading-7 text-muted-foreground">
            {t(
              "A few simple steps will make AgroMind yours. Your progress is saved as you continue.",
            )}
          </p>
        )}
        {step === 1 && (
          <div className="space-y-2">
            <label
              htmlFor="onboarding-name"
              className="block text-sm font-semibold"
            >
              {t("Full name")}
            </label>
            <input
              id="onboarding-name"
              required
              maxLength={120}
              value={name}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              className={accountInputClass}
            />
          </div>
        )}
        {step === 2 && (
          <PreferenceSelect
            label={t("Country / Region")}
            value={country}
            options={COUNTRY_CODES.map((value) => ({
              value,
              label: countryDisplayName(value, settings.locale),
            }))}
            onChange={setCountry}
          />
        )}
        {step === 3 && (
          <PreferenceSelect
            label={t("Language")}
            value={language}
            options={LANGUAGE_OPTIONS}
            onChange={setLanguage}
          />
        )}
        {step === 4 && (
          <PreferenceSelect
            label={t("Time zone")}
            value={timezone}
            options={[
              ...new Set([
                "UTC",
                timezone,
                ...Intl.supportedValuesOf("timeZone"),
              ]),
            ].map((value) => ({ value, label: value }))}
            onChange={setTimezone}
          />
        )}
        {step === 5 && (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-muted-foreground">
              {t(
                cloud.farms.length
                  ? "Your first farm is ready. You can now open your dashboard."
                  : "Create your first farm, or import the local backup shown above.",
              )}
            </p>
            {cloud.farms.length > 0 ? (
              <p className="flex items-center gap-2 font-semibold text-primary">
                <CheckCircle2 />
                {cloud.farms[0].name}
              </p>
            ) : (
              <Link
                href="/farms/new"
                className={buttonVariants({
                  className: "min-h-12 w-full rounded-xl",
                })}
              >
                {t("Create first farm")}
              </Link>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              disabled={busy}
              className="min-h-12 rounded-xl"
              onClick={() => setStep(step - 1)}
            >
              {t("Back")}
            </Button>
          )}
          {step < 5 ? (
            <Button
              disabled={busy || (step === 1 && !name.trim())}
              className="min-h-12 flex-1 rounded-xl"
              onClick={next}
            >
              {t(busy ? "Please wait…" : "Continue")}
            </Button>
          ) : (
            cloud.farms.length > 0 && (
              <Button
                disabled={busy}
                className="min-h-12 flex-1 rounded-xl"
                onClick={async () => {
                  if (
                    await run(() => completeOnboardingAction(cloud.user.id))
                  ) {
                    router.replace("/dashboard");
                    router.refresh();
                  }
                }}
              >
                {t("Open dashboard")}
              </Button>
            )
          )}
        </div>
      </section>
    </main>
  );
}
