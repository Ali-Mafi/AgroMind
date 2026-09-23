"use client";

import { ArrowLeft, CheckCircle2, LoaderCircle, MapPin, Sprout } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import {
  requestCurrentLocation,
  reverseGeocode,
} from "@/features/region/services/location-service";
import { Button, buttonVariants } from "@/components/ui/button";
import { accountInputClass, LogoutButton } from "./account-shell";

const steps = [
  "Welcome to AgroMind",
  "Your name",
  "Your region",
  "Your language",
  "Your first farm",
];

function browserTimeZone(fallback: string) {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback || "UTC";
  } catch {
    return fallback || "UTC";
  }
}

export function Onboarding() {
  const { cloud, run, busy } = useFarm();
  const settings = useSettings();
  const t = useTranslation();
  const router = useRouter();
  const hasNames = Boolean(
    cloud.profile.first_name.trim() && cloud.profile.last_name.trim(),
  );
  const [step, setStep] = useState(
    hasNames
      ? Math.min(cloud.profile.onboarding_step, 4)
      : Math.min(cloud.profile.onboarding_step, 1),
  );
  const [firstName, setFirstName] = useState(cloud.profile.first_name);
  const [lastName, setLastName] = useState(cloud.profile.last_name);
  const [nameError, setNameError] = useState("");
  const [country, setCountry] = useState(
    settings.preferences.regionConfirmed
      ? settings.country
      : (cloud.profile.country_code ?? settings.country),
  );
  const [language, setLanguage] = useState(
    settings.preferences.language === "auto"
      ? cloud.profile.language
      : settings.language,
  );
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const chooseCountry = (nextCountry: string, source: "manual" | "detected") => {
    setCountry(nextCountry);
    settings.update({
      country: nextCountry,
      regionConfirmed: true,
      regionSource: source,
    });
  };

  const chooseLanguage = (nextLanguage: string) => {
    const normalized = nextLanguage === "fa" ? "fa" : "en";
    setLanguage(normalized);
    settings.update({ language: normalized });
  };

  const saveAndAdvance = async () => {
    if (step === 0) {
      setStep(1);
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    if (!trimmedFirstName || !trimmedLastName) {
      setNameError("Enter your first and last name.");
      if (step !== 1) setStep(1);
      return;
    }

    setNameError("");
    const nextStep = Math.min(4, step + 1);
    const ok = await run(() =>
      saveProfileAction(
        {
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          country_code: country,
          language: language === "fa" ? "fa" : "en",
          timezone: browserTimeZone(cloud.profile.timezone),
          onboarding_step: nextStep,
        },
        cloud.user.id,
      ),
    );
    if (ok) setStep(nextStep);
  };

  const detectMyLocation = async () => {
    setDetectingLocation(true);
    setLocationError("");
    try {
      const coordinates = await requestCurrentLocation();
      const location = await reverseGeocode(coordinates);
      const code = location.countryCode?.toUpperCase();
      if (!code || !COUNTRY_CODES.some((value) => value === code)) {
        setLocationError(
          "Location could not determine your region. Choose it manually.",
        );
        return;
      }
      chooseCountry(code, "detected");
    } catch {
      setLocationError(
        "Location could not determine your region. Choose it manually.",
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
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
          <div className="space-y-5">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Tell us your name to personalize your AgroMind account.")}
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="onboarding-first-name" className="text-sm font-semibold">
                  {t("First name")}
                </label>
                <input
                  id="onboarding-first-name"
                  required
                  maxLength={60}
                  autoComplete="given-name"
                  dir="auto"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    setNameError("");
                  }}
                  className={accountInputClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="onboarding-last-name" className="text-sm font-semibold">
                  {t("Last name")}
                </label>
                <input
                  id="onboarding-last-name"
                  required
                  maxLength={60}
                  autoComplete="family-name"
                  dir="auto"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    setNameError("");
                  }}
                  className={accountInputClass}
                />
              </div>
            </div>
            {nameError && (
              <p role="alert" className="text-sm text-destructive">
                {t(nameError)}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <PreferenceSelect
              label={t("Country / Region")}
              value={country}
              options={COUNTRY_CODES.map((value) => ({
                value,
                label: countryDisplayName(value, settings.locale),
              }))}
              onChange={(value) => chooseCountry(value, "manual")}
            />
            <p className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
              <CheckCircle2 className="size-4" />
              {countryDisplayName(country, settings.locale)} · {t("Selected")}
            </p>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full gap-2 rounded-xl"
              disabled={busy || detectingLocation}
              onClick={() => void detectMyLocation()}
            >
              {detectingLocation ? (
                <LoaderCircle className="animate-spin motion-reduce:animate-none" />
              ) : (
                <MapPin />
              )}
              {t(detectingLocation ? "Finding your region…" : "Use my location")}
            </Button>
            {locationError && (
              <p role="alert" className="text-sm text-destructive">
                {t(locationError)}
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <PreferenceSelect
              label={t("Language")}
              value={language}
              options={LANGUAGE_OPTIONS}
              onChange={chooseLanguage}
            />
            <p className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
              <CheckCircle2 className="size-4" />
              {t(language === "fa" ? "Persian" : "English")} · {t("Selected")}
            </p>
          </div>
        )}

        {step === 4 && (
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
              onClick={() => {
                setNameError("");
                setStep(step - 1);
              }}
            >
              <ArrowLeft
                className="size-5 rtl:rotate-180"
                aria-hidden="true"
              />
              <span className="sr-only">{t("Back")}</span>
            </Button>
          )}
          {step < 4 ? (
            <Button
              disabled={busy || detectingLocation}
              className="min-h-12 flex-1 rounded-xl"
              onClick={() => void saveAndAdvance()}
            >
              {busy ? (
                <LoaderCircle
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                t("Continue")
              )}
            </Button>
          ) : (
            cloud.farms.length > 0 && (
              <Button
                disabled={busy}
                className="min-h-12 flex-1 rounded-xl"
                onClick={async () => {
                  if (await run(() => completeOnboardingAction(cloud.user.id))) {
                    router.replace("/dashboard");
                    router.refresh();
                  }
                }}
              >
                {busy ? (
                  <LoaderCircle
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  t("Open dashboard")
                )}
              </Button>
            )
          )}
        </div>
      </section>
    </main>
  );
}
